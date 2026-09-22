import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { occasionSchema } from '@/lib/validations/occasion';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { publishChange } from '@/lib/live-sync';
import type { LiveAction } from '@/lib/live-events';
import { Prisma } from '@prisma/client';

/** Occasions render on the storefront home page and their own pages; see lib/live-sync.ts. */
export function revalidateStorefront(action: LiveAction, id: string) {
  publishChange({ type: `occasion.${action}`, ids: [id] });
}

const SORTABLE = ['displayOrder', 'title', 'createdAt'] as const;
type SortField = (typeof SORTABLE)[number];

/** Unique slug from a title (same approach as the categories route). */
export async function uniqueOccasionSlug(title: string, excludeId?: string) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'occasion';
  const clash = await prisma.occasion.findFirst({
    where: { slug: base, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  return clash ? `${base}-${Date.now()}` : base;
}

/** Rejects ids that don't exist, so mappings can never point at missing products. */
export async function assertProductsExist(productIds: string[]) {
  const found = await prisma.product.count({ where: { id: { in: productIds } } });
  return found === productIds.length;
}

export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10') || 10));

    const sortParam = searchParams.get('sortBy') || 'displayOrder';
    const sortBy: SortField = (SORTABLE as readonly string[]).includes(sortParam)
      ? (sortParam as SortField)
      : 'displayOrder';
    const sortOrder: Prisma.SortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    const where: Prisma.OccasionWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { subtitle: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      prisma.occasion.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        // _count keeps "Products Count" a single query — no N+1.
        include: { _count: { select: { products: true } } },
      }),
      prisma.occasion.count({ where }),
    ]);

    const occasions = rows.map(({ _count, ...o }) => ({ ...o, productsCount: _count.products }));

    return NextResponse.json({
      occasions,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Failed to fetch occasions:', error);
    return NextResponse.json({ error: 'Failed to fetch occasions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = occasionSchema.parse(body);

    if (!(await assertProductsExist(data.productIds))) {
      return NextResponse.json({ error: 'One or more selected products no longer exist' }, { status: 400 });
    }

    /*
     * Exactly one occasion may exist. Checked here so the admin gets a clear message rather
     * than a raw constraint error; the unique `singleton` column is the real backstop for two
     * requests arriving at once (handled as P2002 below).
     */
    const existing = await prisma.occasion.findFirst({ select: { id: true } });
    if (existing) {
      return NextResponse.json(
        { error: 'An occasion already exists. Edit or delete it before adding another.' },
        { status: 409 }
      );
    }

    /*
     * Only ONE occasion may be featured — it is the single collection promoted above New
     * Arrivals on the home page. Nothing enforced this before, so several rows could carry
     * isFeatured and the storefront silently showed whichever came first.
     *
     * Demote-then-write inside one transaction, so there is never a moment with two featured
     * rows (or, if the create fails, none).
     */
    const occasion = await prisma.$transaction(async (tx) => {
      if (data.isFeatured) {
        await tx.occasion.updateMany({ where: { isFeatured: true }, data: { isFeatured: false } });
      }
      return tx.occasion.create({
      data: {
        title: data.title,
        slug: await uniqueOccasionSlug(data.title),
        subtitle: data.subtitle,
        description: data.description,
        bannerImage: data.bannerImage,
        buttonText: data.buttonText,
        buttonLink: data.buttonLink,
        isFeatured: data.isFeatured,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        products: { create: data.productIds.map((productId) => ({ productId })) },
      },
      include: { _count: { select: { products: true } } },
      });
    });

    revalidateStorefront('created', occasion.id);
    return NextResponse.json(occasion, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // The singleton index rejected a concurrent second insert.
      return NextResponse.json(
        { error: 'An occasion already exists. Edit or delete it before adding another.' },
        { status: 409 }
      );
    }
    console.error('Failed to create occasion:', error);
    return NextResponse.json({ error: 'Failed to create occasion' }, { status: 500 });
  }
}
