import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { revalidatePath, revalidateTag } from 'next/cache';
import { deleteCloudinaryImage } from '@/lib/cloudinary';
import { subcategorySchema, subcategoryPatchSchema, slugify } from '@/lib/validations/subcategory';
import { NAV_MENU_TAG } from '@/lib/subcategories';
import type { CategoryType } from '@prisma/client';
import { logDbError } from '@/lib/prisma-error';

function revalidateStorefront() {
  revalidateTag(NAV_MENU_TAG, 'max');
  revalidatePath('/', 'layout');
}

async function uniqueSlug(categoryType: CategoryType, desired: string, excludeId: string) {
  const base = slugify(desired) || 'item';
  let slug = base;
  for (let i = 2; ; i++) {
    const clash = await prisma.subcategory.findFirst({
      where: { categoryType, slug, id: { not: excludeId } },
      select: { id: true },
    });
    if (!clash) return slug;
    slug = `${base}-${i}`;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const subcategory = await prisma.subcategory.findUnique({ where: { id } });
    if (!subcategory) return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    return NextResponse.json(subcategory);
  } catch (error) {
    logDbError('GET /subcategories/[id]', error);
    return NextResponse.json({ error: 'Failed to fetch subcategory' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const data = subcategorySchema.parse(body);

    const existing = await prisma.subcategory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });

    // Re-derive the slug only when the name or explicit slug changed.
    const wantsSlug = data.slug?.trim() || data.name;
    const slugChanged = slugify(wantsSlug) !== existing.slug;
    const slug = slugChanged ? await uniqueSlug(existing.categoryType, wantsSlug, id) : existing.slug;

    // If the image was replaced, clean up the old Cloudinary asset.
    if (existing.imagePublicId && existing.imagePublicId !== (data.imagePublicId ?? null)) {
      await deleteCloudinaryImage(existing.imagePublicId).catch(() => {});
    }

    const updated = await prisma.subcategory.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        image: data.image ?? null,
        imagePublicId: data.imagePublicId ?? null,
        hoverColor: data.hoverColor ?? null,
        explore: data.explore,
        // A pinned "All …" row always stays first; ignore any order sent for it.
        displayOrder: existing.pinned ? 0 : data.displayOrder,
        active: data.active,
      },
    });

    revalidateStorefront();
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    logDbError('PUT /subcategories/[id]', error);
    return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 });
  }
}

/** Quick toggle (active / explore / displayOrder) — used by the row switches. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const data = subcategoryPatchSchema.parse(await request.json());
    const updated = await prisma.subcategory.update({ where: { id }, data });
    revalidateStorefront();
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    logDbError('PATCH /subcategories/[id]', error);
    return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const existing = await prisma.subcategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });

    // The pinned "All …" row is a permanent part of every category.
    if (existing.pinned) {
      return NextResponse.json({ error: 'The default “All” item cannot be deleted' }, { status: 400 });
    }
    // Force the admin to reassign products first, so nothing is orphaned.
    if (existing._count.products > 0) {
      return NextResponse.json(
        { error: `Move its ${existing._count.products} product(s) to another subcategory first` },
        { status: 400 }
      );
    }

    if (existing.imagePublicId) await deleteCloudinaryImage(existing.imagePublicId).catch(() => {});
    await prisma.subcategory.delete({ where: { id } });

    revalidateStorefront();
    return NextResponse.json({ message: 'Subcategory deleted' });
  } catch (error) {
    logDbError('DELETE /subcategories/[id]', error);
    return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 });
  }
}
