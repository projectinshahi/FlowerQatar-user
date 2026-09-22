import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { occasionSchema, occasionStatusSchema } from '@/lib/validations/occasion';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { assertProductsExist, revalidateStorefront, uniqueOccasionSlug } from '../route';

type Params = { params: Promise<{ id: string }> };

/** Single occasion, shaped for the edit form (productIds pre-selected). */
export async function GET(_request: Request, { params }: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const occasion = await prisma.occasion.findUnique({
      where: { id },
      include: { products: { select: { productId: true } } },
    });

    if (!occasion) {
      return NextResponse.json({ error: 'Occasion not found' }, { status: 404 });
    }

    const { products, ...rest } = occasion;
    return NextResponse.json({ ...rest, productIds: products.map((p) => p.productId) });
  } catch (error) {
    console.error('Failed to fetch occasion:', error);
    return NextResponse.json({ error: 'Failed to fetch occasion' }, { status: 500 });
  }
}

/** Full update — also synchronises the product mappings. */
export async function PUT(request: Request, { params }: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const data = occasionSchema.parse(body);

    const existing = await prisma.occasion.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Occasion not found' }, { status: 404 });
    }

    if (!(await assertProductsExist(data.productIds))) {
      return NextResponse.json({ error: 'One or more selected products no longer exist' }, { status: 400 });
    }

    const slug = await uniqueOccasionSlug(data.title, id);

    // One transaction: update fields, drop de-selected mappings, add new ones.
    // skipDuplicates leaves already-mapped products untouched (no churn, and the
    // @@unique([occasionId, productId]) index stays satisfied).
    const updated = await prisma.$transaction(async (tx) => {
      // Featuring this one un-features the rest: the home page promotes exactly one
      // collection, and two featured rows made that choice arbitrary.
      if (data.isFeatured) {
        await tx.occasion.updateMany({
          where: { isFeatured: true, id: { not: id } },
          data: { isFeatured: false },
        });
      }
      await tx.occasion.update({
        where: { id },
        data: {
          title: data.title,
          slug,
          subtitle: data.subtitle,
          description: data.description,
          bannerImage: data.bannerImage,
          buttonText: data.buttonText,
          buttonLink: data.buttonLink,
          isFeatured: data.isFeatured,
          displayOrder: data.displayOrder,
          isActive: data.isActive,
        },
      });
      await tx.occasionProduct.deleteMany({
        where: { occasionId: id, productId: { notIn: data.productIds } },
      });
      await tx.occasionProduct.createMany({
        data: data.productIds.map((productId) => ({ occasionId: id, productId })),
        skipDuplicates: true,
      });
      return tx.occasion.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } },
      });
    });

    revalidateStorefront('updated', id);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Failed to update occasion:', error);
    return NextResponse.json({ error: 'Failed to update occasion' }, { status: 500 });
  }
}

/** Toggle active status. */
export async function PATCH(request: Request, { params }: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = occasionStatusSchema.parse(body);

    const existing = await prisma.occasion.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Occasion not found' }, { status: 404 });
    }

    const updated = await prisma.occasion.update({ where: { id }, data: { isActive } });
    revalidateStorefront('updated', id);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Failed to update occasion status:', error);
    return NextResponse.json({ error: 'Failed to update occasion status' }, { status: 500 });
  }
}

/** Delete the occasion. Mapping rows cascade; Products are never touched. */
export async function DELETE(_request: Request, { params }: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const existing = await prisma.occasion.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Occasion not found' }, { status: 404 });
    }

    await prisma.occasion.delete({ where: { id } });
    revalidateStorefront('deleted', id);
    return NextResponse.json({ message: 'Occasion deleted successfully' });
  } catch (error) {
    console.error('Failed to delete occasion:', error);
    return NextResponse.json({ error: 'Failed to delete occasion' }, { status: 500 });
  }
}
