import { cache } from 'react';
import { unstable_cache } from 'next/cache';
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

export const REVIEWS_TAG = 'reviews';

// Throws on a database error so the failure is never cached.
async function readRatingSummaries(): Promise<[string, { average: number; count: number }][]> {
  const rows = await prisma.productReview.groupBy({
    by: ['productId'],
    where: { isPublished: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return rows.flatMap((r): [string, { average: number; count: number }][] =>
    r._avg.rating != null && r._count.rating > 0
      ? // One decimal, matching how the storefront prints it ("4.8").
        [[r.productId, { average: Math.round(r._avg.rating * 10) / 10, count: r._count.rating }]]
      : []
  );
}

// Admin review edits purge the tag (lib/live-sync.ts). Entries, not a Map: the cache stores JSON.
const loadRatingSummaries = unstable_cache(readRatingSummaries, ['rating-summaries-v1'], {
  tags: [REVIEWS_TAG],
  revalidate: 3600,
});

/**
 * Average rating + count for every product with published reviews.
 *
 * `getProductReviews` above loads every review row for a single product, which is right for the
 * product page and wrong for a listing: it would be one query per card and would pull content
 * nobody renders. This aggregates in the database instead and is cached, so a listing costs no
 * per-visit query and gets only the two numbers a card or quick view actually shows.
 *
 * Products with no published reviews are simply absent from the map — callers decide whether to
 * show nothing or a default. A database failure returns an empty map, matching the rest of this
 * module: ratings are decoration, never a reason to fail a listing.
 */
export const getRatingSummaries = cache(async (): Promise<Map<string, { average: number; count: number }>> => {
  try {
    return new Map(await loadRatingSummaries());
  } catch (e) {
    logDbError('getRatingSummaries', e);
    return new Map();
  }
});
