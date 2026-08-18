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
