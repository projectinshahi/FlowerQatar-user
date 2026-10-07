import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { subcategorySchema, subcategoryListQuerySchema } from '@/lib/validations/subcategory';
import { publishChange } from '@/lib/live-sync';
import { logDbError } from '@/lib/prisma-error';
import { z } from 'zod';

export async function GET(request: Request) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const query = subcategoryListQuerySchema.parse(params);
    const where: Prisma.SubcategoryWhereInput = {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.status === 'all' ? {} : { isActive: query.status === 'active' }),
      ...(query.search ? { OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { category: { name: { contains: query.search, mode: 'insensitive' } } },
      ] } : {}),
    };
    const [subcategories, total] = await prisma.$transaction([
      prisma.subcategory.findMany({ where, include: { category: { select: { id: true, name: true } }, _count: { select: { products: true } } }, orderBy: { [query.sortBy]: query.sortOrder }, skip: (query.page - 1) * query.limit, take: query.limit }),
      prisma.subcategory.count({ where }),
    ]);
    return NextResponse.json({ subcategories, pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid query' }, { status: 400 });
    logDbError('GET /admin/subcategories', error); return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const data = subcategorySchema.parse(await request.json());
    const subcategory = await prisma.$transaction(async (tx) => {
      const category = await tx.category.findFirst({ where: { id: data.categoryId, isActive: true }, select: { id: true } });
      if (!category) throw new Error('PARENT_CATEGORY_INACTIVE');
      const duplicate = await tx.subcategory.findFirst({ where: { categoryId: data.categoryId, name: { equals: data.name, mode: 'insensitive' } }, select: { id: true } });
      if (duplicate) throw new Error('DUPLICATE');
      // Append to the end of both orderings so a new row never collides with an existing position.
      const last = await tx.subcategory.aggregate({
        where: { categoryId: data.categoryId },
        _max: { navigationPosition: true, gardenPosition: true },
      });
      return tx.subcategory.create({
        data: {
          ...data,
          navigationPosition: (last._max.navigationPosition ?? 0) + 1,
          gardenPosition: (last._max.gardenPosition ?? 0) + 1,
        },
        include: { category: { select: { id: true, name: true } } },
      });
    });
    publishChange({ type: 'subcategory.created', ids: [subcategory.id] }); return NextResponse.json(subcategory, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    if (error instanceof Error && error.message === 'DUPLICATE') return NextResponse.json({ error: 'A subcategory with this name already exists in the selected category' }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NextResponse.json({ error: 'A subcategory with this name already exists in the selected category' }, { status: 409 });
    if (error instanceof Error && error.message === 'PARENT_CATEGORY_INACTIVE') return NextResponse.json({ error: 'Select an active parent category' }, { status: 400 });
    logDbError('POST /admin/subcategories', error); return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 });
  }
}
