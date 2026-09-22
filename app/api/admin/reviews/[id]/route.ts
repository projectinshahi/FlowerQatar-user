import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { publishChange } from '@/lib/live-sync';
import type { LiveAction } from '@/lib/live-events';
import { reviewPatchSchema, reviewSchema } from '@/lib/reviews';
import { isDbUnreachable, logDbError } from '@/lib/prisma-error';

type Context = { params: Promise<{ id: string }> };

function fail(context: string, error: unknown) {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? 'Invalid input', field: issue?.path.join('.') || undefined },
      { status: 400 }
    );
  }
  // P2025 = the row was deleted by someone else between load and save.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }
  if (isDbUnreachable(error)) {
    logDbError(context, error);
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }
  logDbError(context, error);
  return NextResponse.json({ error: 'Review operation failed' }, { status: 500 });
}

/** Drop the product page cache so an edit shows immediately, and refresh open copies of it. */
async function revalidateProduct(productId: string, action: LiveAction) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (product) publishChange({ type: `review.${action}`, ids: [productId], slugs: [product.slug] });
}

/** PUT — full update from the edit form. */
export async function PUT(request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const data = reviewSchema.parse(await request.json());
    const review = await prisma.productReview.update({
      where: { id },
      data,
      include: { product: { select: { id: true, name: true, slug: true } } },
    });
    publishChange({ type: 'review.updated', ids: [review.product.id], slugs: [review.product.slug] });
    return NextResponse.json(review);
  } catch (error) {
    return fail('PUT /api/admin/reviews/[id]', error);
  }
}

/** PATCH — inline toggles from the list (publish/hide, quick rating change). */
export async function PATCH(request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const data = reviewPatchSchema.parse(await request.json());
    const review = await prisma.productReview.update({ where: { id }, data });
    await revalidateProduct(review.productId, 'updated');
    return NextResponse.json(review);
  } catch (error) {
    return fail('PATCH /api/admin/reviews/[id]', error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;

  try {
    const { id } = await params;
    const review = await prisma.productReview.delete({ where: { id } });
    await revalidateProduct(review.productId, 'deleted');
    return NextResponse.json({ message: 'Review deleted' });
  } catch (error) {
    return fail('DELETE /api/admin/reviews/[id]', error);
  }
}
