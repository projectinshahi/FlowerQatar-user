import { z } from 'zod';

/**
 * Validation for the Occasion module. Mirrors lib/validations/category.ts:
 * the same schema validates the admin form (via zodResolver) and every request
 * on the server, so the client can never be the only line of defence.
 */

// Treats "" / null / undefined as "no banner". Otherwise must be a real URL
// (Cloudinary) or a root-relative path (local /images asset).
const optionalBanner = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z
    .string()
    .refine((v) => /^https?:\/\//.test(v) || v.startsWith('/'), 'Banner must be a valid URL')
    .nullable()
);

export const occasionSchema = z.object({
  title: z
    .string()
    .min(2, 'Heading must be at least 2 characters')
    .max(100, 'Heading must be at most 100 characters')
    .trim(),
  subtitle: z
    .string()
    .min(2, 'Sub heading must be at least 2 characters')
    .max(250, 'Sub heading must be at most 250 characters')
    .trim(),
  description: z
    .string()
    .max(600, 'Description must be at most 600 characters')
    .trim()
    .optional()
    .nullable(),
  bannerImage: optionalBanner,
  // Optional: falls back to "View Collection" / /occasion/[slug] on the storefront.
  buttonText: z.string().max(50, 'Button text must be at most 50 characters').trim().optional().nullable(),
  // Rendered as an href, so the same shape rule the banner already uses: an absolute
  // http(s) URL or a root-relative path, never an arbitrary scheme.
  buttonLink: z
    .string()
    .max(255, 'Button link must be at most 255 characters')
    .trim()
    .refine(
      (v) => v === '' || /^https?:\/\//.test(v) || v.startsWith('/'),
      'Link must start with / or https://'
    )
    .optional()
    .nullable(),
  isFeatured: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0, 'Display order must be 0 or greater').default(0),
  isActive: z.boolean().default(true),
  productIds: z
    .array(z.string().uuid('Invalid product id'))
    .min(1, 'Select at least one product')
    // De-dupe defensively; the DB also enforces this via @@unique([occasionId, productId]).
    .transform((ids) => Array.from(new Set(ids))),
});

/** PATCH payload — status toggle only. */
export const occasionStatusSchema = z.object({
  isActive: z.boolean(),
});

export type OccasionFormData = z.input<typeof occasionSchema>;
