import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { giftGroupListQuerySchema, giftGroupSchema } from '@/lib/validations/gift-group';
import { fail, revalidateStorefront } from '@/lib/gift-groups-api';

// GET /api/admin/gift-groups — paged list for the admin table.
export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const query = giftGroupListQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams)
    );
    const where: Prisma.GiftGroupWhereInput = {
      ...(query.status === 'all' ? {} : { isActive: query.status === 'active' }),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [giftGroups, total] = await prisma.$transaction([
      prisma.giftGroup.findMany({
        where,
        // _count avoids N+1 for the "4 Categories / 5 Gifts" columns.
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          displayOrder: true,
          updatedAt: true,
          categories: { select: { category: { select: { id: true, name: true } } } },
          _count: { select: { categories: true, gifts: true } },
        },
        orderBy:
          query.sortBy === 'displayOrder'
            ? [{ displayOrder: query.sortOrder }, { name: 'asc' }]
            : { [query.sortBy]: query.sortOrder },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.giftGroup.count({ where }),
    ]);

    return NextResponse.json({
      giftGroups,
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    });
  } catch (error) {
    return fail(error, 'GET /admin/gift-groups');
  }
}

// POST /api/admin/gift-groups — create a group with its categories and (optional) gifts.
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const data = giftGroupSchema.parse(await request.json());

    // One round trip: the group, its category links and all its gifts are created together.
    const created = await prisma.giftGroup.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
        categories: { create: data.categoryIds.map((categoryId) => ({ categoryId })) },
        gifts: {
          create: data.gifts.map((g, i) => ({
            name: g.name,
            price: g.price,
            image: g.image,
            isActive: g.isActive,
            displayOrder: g.displayOrder || i,
          })),
        },
      },
      select: { id: true, name: true },
    });

    revalidateStorefront();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return fail(error, 'POST /admin/gift-groups');
  }
}
