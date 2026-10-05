import { z } from 'zod';
import { MAX_RATING, MIN_RATING } from '@/lib/reviews';

/*
 * Review request schemas. Kept apart from lib/reviews.ts so the storefront, which imports the
 * star and sort helpers from there, does not download zod with them.
 */

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
