import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createSubcategorySchema, categoryTypeSchema, slugify } from '@/lib/validations/subcategory';
import { NAV_MENU_TAG } from '@/lib/subcategories';
import { logDbError } from '@/lib/prisma-error';

// Subcategory changes affect the mega-menus (in the root layout), the home page
// "Explore Our Garden", and every category listing — bust the cached menu and the tree.
function revalidateStorefront() {
  revalidateTag(NAV_MENU_TAG, 'max');
  revalidatePath('/', 'layout');
}

/** Unique slug within a category: derive from name if blank, then de-dupe with a suffix. */
async function uniqueSlug(categoryType: z.infer<typeof categoryTypeSchema>, desired: string, excludeId?: string) {
  const base = slugify(desired) || 'item';
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await prisma.subcategory.findFirst({
      where: { categoryType, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return slug;
    slug = `${base}-${i}`;
  }
}

export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(request.url);
    const parsedType = categoryTypeSchema.safeParse(searchParams.get('categoryType'));
    if (!parsedType.success) {
      return NextResponse.json({ error: 'Invalid or missing categoryType' }, { status: 400 });
    }
    const search = searchParams.get('search')?.trim() || '';

    const subcategories = await prisma.subcategory.findMany({
      where: {
        categoryType: parsedType.data,
        ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      orderBy: [{ pinned: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });

    return NextResponse.json({ subcategories });
  } catch (error) {
    logDbError('GET /subcategories', error);
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const { categoryType, slug: rawSlug, ...data } = createSubcategorySchema.parse(body);

    const slug = await uniqueSlug(categoryType, rawSlug || data.name);

    const subcategory = await prisma.subcategory.create({
      data: {
        categoryType,
        name: data.name,
        slug,
        image: data.image ?? null,
        imagePublicId: data.imagePublicId ?? null,
        hoverColor: data.hoverColor ?? null,
        explore: data.explore,
        displayOrder: data.displayOrder,
        active: data.active,
        pinned: false, // pinned "All …" rows are system-managed only
      },
    });

    revalidateStorefront();
    return NextResponse.json(subcategory, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    logDbError('POST /subcategories', error);
    return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 });
  }
}
