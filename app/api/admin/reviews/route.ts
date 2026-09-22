import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { publishChange } from '@/lib/live-sync';
import { reviewListQuerySchema, reviewSchema } from '@/lib/reviews';
import { isDbUnreachable, logDbError } from '@/lib/prisma-error';

function fail(context: string, error: unknown) {
  if (error instanceof z.ZodError) {
    const issue = error.issues[0];
    return NextResponse.json(
      { error: issue?.message ?? 'Invalid input', field: issue?.path.join('.') || undefined },
      { status: 400 }
    );
  }
  // The product was deleted between the form loading and the save.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    return NextResponse.json({ error: 'That product no longer exists' }, { status: 404 });
  }
  if (isDbUnreachable(error)) {
    logDbError(context, error);
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }
  logDbError(context, error);
  return NextResponse.json({ error: 'Review operation failed' }, { status: 500 });
}

/** GET /api/admin/reviews — paged list, filterable by product, status and text. */
export async function GET(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  try {
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const q = reviewListQuerySchema.parse(params);

    const where: Prisma.ProductReviewWhereInput = {
      ...(q.productId ? { productId: q.productId } : {}),
      ...(q.status === 'all' ? {} : { isPublished: q.status === 'published' }),
      ...(q.search
        ? {
            OR: [
              { authorName: { contains: q.search, mode: 'insensitive' } },
              { title: { contains: q.search, mode: 'insensitive' } },
              { content: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [reviews, total] = await prisma.$transaction([
      prisma.productReview.findMany({
        where,
        orderBy: { reviewedAt: 'desc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        include: { product: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.productReview.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) },
    });
  } catch (error) {
    return fail('GET /api/admin/reviews', error);
  }
}

/** POST /api/admin/reviews — add a review. */
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;

  try {
    const data = reviewSchema.parse(await request.json());
    const review = await prisma.productReview.create({
      data: { ...data, reviewedAt: data.reviewedAt ?? new Date() },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });

    // The product page renders reviews server-side, so its cache must drop.
    publishChange({ type: 'review.created', ids: [review.product.id], slugs: [review.product.slug] });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return fail('POST /api/admin/reviews', error);
  }
}
