import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { revalidatePath, revalidateTag } from 'next/cache';
import { subcategoryPatchSchema, subcategorySchema } from '@/lib/validations/subcategory';
import { NAV_MENU_TAG } from '@/lib/subcategories';
import { revalidateStoreProducts } from '@/lib/store-products';
import { logDbError } from '@/lib/prisma-error';
import { z } from 'zod';

function revalidateStorefront() { revalidateTag(NAV_MENU_TAG, 'max'); revalidatePath('/', 'layout'); revalidateStoreProducts(); }
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const { id } = await params;
    const subcategory = await prisma.subcategory.findUnique({ where: { id }, include: { category: { select: { id: true, name: true } }, _count: { select: { products: true } } } });
    return subcategory ? NextResponse.json(subcategory) : NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
  } catch (error) { logDbError('GET /admin/subcategories/[id]', error); return NextResponse.json({ error: 'Failed to fetch subcategory' }, { status: 500 }); }
}

export async function PUT(request: Request, { params }: Context) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const { id } = await params; const data = subcategorySchema.parse(await request.json());
    const updated = await prisma.$transaction(async (tx) => {
      if (!await tx.subcategory.findUnique({ where: { id }, select: { id: true } })) throw new Error('NOT_FOUND');
      if (!await tx.category.findFirst({ where: { id: data.categoryId, isActive: true }, select: { id: true } })) throw new Error('PARENT_CATEGORY_INACTIVE');
      const duplicate = await tx.subcategory.findFirst({ where: { categoryId: data.categoryId, name: { equals: data.name, mode: 'insensitive' }, id: { not: id } }, select: { id: true } });
      if (duplicate) throw new Error('DUPLICATE');
      return tx.subcategory.update({ where: { id }, data, include: { category: { select: { id: true, name: true } } } });
    });
    revalidateStorefront(); return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    if (error instanceof Error && error.message === 'NOT_FOUND') return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    if (error instanceof Error && error.message === 'DUPLICATE') return NextResponse.json({ error: 'A subcategory with this name already exists in the selected category' }, { status: 409 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NextResponse.json({ error: 'A subcategory with this name already exists in the selected category' }, { status: 409 });
    if (error instanceof Error && error.message === 'PARENT_CATEGORY_INACTIVE') return NextResponse.json({ error: 'Select an active parent category' }, { status: 400 });
    logDbError('PUT /admin/subcategories/[id]', error); return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const { id } = await params; const data = subcategoryPatchSchema.parse(await request.json());
    const updated = await prisma.subcategory.update({ where: { id }, data, include: { category: { select: { id: true, name: true } } } });
    revalidateStorefront(); return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    logDbError('PATCH /admin/subcategories/[id]', error); return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const { id } = await params;
    const existing = await prisma.subcategory.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (!existing) return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
    if (existing._count.products) return NextResponse.json({ error: `This subcategory is used by ${existing._count.products} product(s). Reassign them before deleting it.` }, { status: 409 });
    await prisma.subcategory.delete({ where: { id } }); revalidateStorefront();
    return NextResponse.json({ message: 'Subcategory deleted' });
  } catch (error) { logDbError('DELETE /admin/subcategories/[id]', error); return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 }); }
}
