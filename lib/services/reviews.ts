import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';
import { relativeTime, summarise, type RatingSummary } from '@/lib/reviews';

/** A review shaped for the storefront, with its date already rendered. */
export type StoreReview = {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  content: string;
  /** e.g. "3 months ago" — computed server-side so server and client agree. */
  when: string;
};

export type ProductReviews = {
  reviews: StoreReview[];
  summary: RatingSummary;
};

const EMPTY: ProductReviews = {
  reviews: [],
  summary: { average: null, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
};

/**
 * Published reviews for one product, newest first, plus the rating summary.
 *
 * A database failure returns an empty set rather than throwing: reviews are supporting
 * content, and losing them must never take down the product page itself.
 */
export const getProductReviews = cache(async (productId: string): Promise<ProductReviews> => {
  try {
    const rows = await prisma.productReview.findMany({
      where: { productId, isPublished: true },
      orderBy: { reviewedAt: 'desc' },
      select: {
        id: true,
        authorName: true,
        rating: true,
        title: true,
        content: true,
        reviewedAt: true,
      },
    });

    const now = new Date();
    return {
      reviews: rows.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        content: r.content,
        when: relativeTime(r.reviewedAt, now),
      })),
      summary: summarise(rows.map((r) => r.rating)),
    };
  } catch (error) {
    logDbError(`getProductReviews(${productId})`, error);
    return EMPTY;
  }
});

/**
 * Average rating + count for many products at once.
 *
 * `getProductReviews` above loads every review row for a single product, which is right for the
 * product page and wrong for a listing: it would be one query per card and would pull content
 * nobody renders. This aggregates in the database instead, so a grid of products costs one
 * round trip and returns only the two numbers a card or quick view actually shows.
 *
 * Products with no published reviews are simply absent from the map — callers decide whether to
 * show nothing or a default. A database failure returns an empty map, matching the rest of this
 * module: ratings are decoration, never a reason to fail a listing.
 */
export const getRatingSummaries = cache(
  async (productIds: string[]): Promise<Map<string, { average: number; count: number }>> => {
    const out = new Map<string, { average: number; count: number }>();
    if (productIds.length === 0) return out;
    try {
      const rows = await prisma.productReview.groupBy({
        by: ['productId'],
        where: { productId: { in: productIds }, isPublished: true },
        _avg: { rating: true },
        _count: { rating: true },
      });
      for (const r of rows) {
        if (r._avg.rating == null || r._count.rating === 0) continue;
        // One decimal, matching how the storefront prints it ("4.8").
        out.set(r.productId, { average: Math.round(r._avg.rating * 10) / 10, count: r._count.rating });
      }
    } catch (e) {
      logDbError('getRatingSummaries', e);
    }
    return out;
  }
);
