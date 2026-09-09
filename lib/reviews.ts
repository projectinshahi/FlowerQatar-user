import { z } from 'zod';

/**
 * Review summary maths and request validation.
 *
 * Free of Prisma and next/server so the rules are directly unit-testable
 * (see tests/reviews.test.ts).
 */

export const MIN_RATING = 1;
export const MAX_RATING = 5;

export type RatingSummary = {
  /** Mean rating to one decimal, or null when there are no reviews. */
  average: number | null;
  count: number;
  /** How many reviews at each star level, 1–5. */
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};

const emptyBreakdown = (): RatingSummary['breakdown'] => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

/**
 * Aggregate a set of ratings.
 *
 * Returns `average: null` rather than 0 for an empty set — zero would render as "0.0 stars",
 * which reads as uniformly terrible rather than "not rated yet". Out-of-range values are
 * ignored so one bad row cannot drag the headline figure somewhere impossible.
 */
export function summarise(ratings: number[]): RatingSummary {
  const breakdown = emptyBreakdown();
  const valid = ratings.filter(
    (r) => Number.isInteger(r) && r >= MIN_RATING && r <= MAX_RATING
  );

  for (const r of valid) breakdown[r as 1 | 2 | 3 | 4 | 5] += 1;
  if (valid.length === 0) return { average: null, count: 0, breakdown };

  const mean = valid.reduce((sum, r) => sum + r, 0) / valid.length;
  return {
    average: Math.round(mean * 10) / 10,
    count: valid.length,
    breakdown,
  };
}

/**
 * Whole stars to fill for a given average. Rounds to nearest so 4.5 shows 5 and 4.4 shows 4 —
 * the UI draws whole stars only.
 */
export function filledStars(average: number | null): number {
  if (average === null) return 0;
  return Math.min(MAX_RATING, Math.max(0, Math.round(average)));
}

/**
 * "3 months ago" style label. Written by hand rather than via Intl.RelativeTimeFormat with a
 * runtime locale, because this is rendered on the server and hydrated on the client — a
 * locale-dependent string would differ between the two and break hydration.
 */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 0) return 'Just now'; // clock skew — never say "in -3 days"
  if (seconds < 60) return 'Just now';

  const units: [label: string, seconds: number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];

  for (const [label, size] of units) {
    const value = Math.floor(seconds / size);
    if (value >= 1) return `${value} ${label}${value === 1 ? '' : 's'} ago`;
  }
  return 'Just now';
}

/* ─────────────────────────── Request schemas ─────────────────────────── */

export const reviewSchema = z.object({
  productId: z.string().uuid('Select a product'),
  authorName: z
    .string()
    .trim()
    .min(1, 'Customer name is required')
    .max(80, 'Customer name must be at most 80 characters'),
  rating: z.coerce
    .number({ message: 'Rating is required' })
    .int('Rating must be a whole number')
    .min(MIN_RATING, `Rating must be at least ${MIN_RATING}`)
    .max(MAX_RATING, `Rating must be at most ${MAX_RATING}`),
  title: z
    .string()
    .trim()
    .max(120, 'Title must be at most 120 characters')
    .optional()
    .transform((v) => v || null),
  content: z
    .string()
    .trim()
    .min(1, 'Review text is required')
    .max(4000, 'Review text must be at most 4000 characters'),
  isPublished: z.boolean().default(true),
  /** Optional — defaults to now when the admin does not set a date. */
  reviewedAt: z.coerce.date().optional(),
});

/** Inline row edits from the admin list: one field at a time, never the whole record. */
export const reviewPatchSchema = z
  .object({
    isPublished: z.boolean().optional(),
    rating: z.coerce.number().int().min(MIN_RATING).max(MAX_RATING).optional(),
  })
  .strict();

export const reviewListQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  status: z.enum(['all', 'published', 'hidden']).default('all'),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReviewInput = z.output<typeof reviewSchema>;
export type ReviewFormData = z.input<typeof reviewSchema>;

/* ─────────────────────────── storefront sort order ─────────────────────────── */

/**
 * Sort options offered on the product page.
 *
 * "Most / Least Helpful" are deliberately absent: ProductReview carries no helpfulness vote,
 * so those could only sort by nothing — a control that looks functional and is not. "Photos &
 * Videos" is absent for the same reason: reviews hold no media.
 */
export const REVIEW_SORTS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest Rating' },
  { value: 'lowest', label: 'Lowest Rating' },
] as const;

export type ReviewSort = (typeof REVIEW_SORTS)[number]['value'];

/**
 * Reorders a review list that arrives NEWEST-FIRST from the server.
 *
 * That ordering is the contract `getProductReviews` provides (`orderBy: reviewedAt desc`), and
 * "oldest" depends on it: the client is handed a relative string ("1 week ago"), never a
 * sortable date, so reversing is exact where comparing those strings would be nonsense.
 *
 * Rating sorts rely on Array.prototype.sort being stable (guaranteed since ES2019) so equal
 * ratings keep their newest-first order. Always returns a new array — the caller's list is a
 * memoised source and must not be mutated.
 */
export function sortReviews<T extends { rating: number }>(reviews: T[], sort: ReviewSort): T[] {
  switch (sort) {
    case 'oldest':
      return [...reviews].reverse();
    case 'highest':
      return [...reviews].sort((a, b) => b.rating - a.rating);
    case 'lowest':
      return [...reviews].sort((a, b) => a.rating - b.rating);
    case 'recent':
    default:
      return [...reviews];
  }
}
