import { z } from 'zod';

/**
 * Gift group + gift validation.
 *
 * One schema file per resource, reused by BOTH the admin form (via zodResolver) and the API
 * route, so the rules a admin sees inline are the rules the server enforces.
 */

const groupName = z
  .string()
  .trim()
  .min(1, 'Group name is required')
  .max(120, 'Group name must be 120 characters or fewer');

const giftName = z
  .string()
  .trim()
  .min(1, 'Gift name is required')
  .max(120, 'Gift name must be 120 characters or fewer');

/** Cloudinary URL (or a root-relative path), matching lib/validations/product.ts. */
const giftImage = z
  .string()
  .trim()
  .min(1, 'Gift image is required')
  .refine((v) => /^https?:\/\//i.test(v) || v.startsWith('/'), 'Enter a valid image URL');

/**
 * Price: rejects negatives, blanks and non-numbers. `z.coerce` because number inputs hand
 * back strings; an empty input coerces to NaN, which the finite check turns into a message
 * rather than a NaN silently reaching the database.
 */
const giftPrice = z.coerce
  .number()
  .refine((v) => Number.isFinite(v), 'Price is required and must be a number')
  .refine((v) => v >= 0, 'Price cannot be negative')
  .refine((v) => v <= 999999, 'Price is too large');

const displayOrder = z.coerce
  .number()
  .int('Display order must be a whole number')
  .min(0, 'Display order must be 0 or greater')
  .default(0);

/** A gift inside the group form. `id` present = update that row, absent = create it. */
export const nestedGiftSchema = z.object({
  id: z.string().uuid().optional(),
  name: giftName,
  price: giftPrice,
  image: giftImage,
  isActive: z.boolean().default(true),
  displayOrder,
});

export const giftGroupSchema = z.object({
  name: groupName,
  description: z
    .string()
    .trim()
    .max(500, 'Description must be 500 characters or fewer')
    .optional()
    .nullable()
    .transform((v) => v || null),
  isActive: z.boolean().default(true),
  displayOrder,
  // Duplicates are stripped here as well as blocked by the DB unique index.
  categoryIds: z
    .array(z.string().uuid('Invalid category id'))
    .min(1, 'Please select at least one category.')
    .transform((ids) => Array.from(new Set(ids))),
  gifts: z.array(nestedGiftSchema).max(200, 'Too many gifts in one group').default([]),
});

/** Inline row toggles (status / order) — never touches the other fields. */
export const giftGroupPatchSchema = z
  .object({ isActive: z.boolean().optional(), displayOrder: displayOrder.optional() })
  .strict();

export const giftGroupListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'inactive']).default('all'),
  sortBy: z.enum(['name', 'displayOrder', 'createdAt', 'updatedAt']).default('displayOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GiftGroupFormData = z.input<typeof giftGroupSchema>;
