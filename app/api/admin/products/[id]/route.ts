import { NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct } from '@/lib/actions/product.actions';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { logDbError } from '@/lib/prisma-error';
import { revalidateStoreProducts } from '@/lib/store-products';
import type { CategoryType } from '@prisma/client';
import { z } from 'zod';

const assignSchema = z.object({ subcategoryId: z.string().uuid().nullable() }).strict();

/**
 * Reassign an EXISTING product to a Flower (or any) subcategory. Deliberately narrow — it
 * only moves the reference, so no product record is ever duplicated. `categoryType` is kept
 * in sync with the new parent so category filters keep agreeing with the subcategory.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const { id } = await params;
    const { subcategoryId } = assignSchema.parse(await request.json());

    let categoryType: CategoryType | null = null;
    if (subcategoryId) {
      const sub = await prisma.subcategory.findUnique({
        where: { id: subcategoryId },
        select: { category: { select: { name: true } } },
      });
      if (!sub) return NextResponse.json({ error: 'Subcategory not found' }, { status: 404 });
      categoryType = sub.category.name as CategoryType;
    }

    const product = await prisma.product.update({
      where: { id },
      data: { subcategoryId, categoryType },
      include: { subcategory: { include: { category: { select: { id: true, name: true } } } } },
    });
    revalidateStoreProducts(); // the listing groups by subcategory/category
    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    logDbError('PATCH /admin/products/[id]', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const { id } = await params;
    const result = await getProductById(id);

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const result = await updateProduct(id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error('Failed to update product:', error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin(); if (denied) return denied;
  try {
    const { id } = await params;
    const result = await deleteProduct(id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
