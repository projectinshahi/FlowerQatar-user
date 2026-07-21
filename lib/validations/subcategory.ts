import { z } from 'zod';

/** The six fixed parent categories — the only valid values; never user-defined. */
export const categoryTypeSchema = z.enum([
  'GIFT_COMBOS',
  'SHOP_BY_OCCASION',
  'BIRTHDAY',
  'FLOWER',
  'LUXURY_GIFTS',
  'EXPLORE',
]);

/**
 * Validation for a Subcategory (the only editable part of the category system —
 * the six parent categories are fixed in code and never created/renamed/deleted).
 * One schema validates the admin form (via zodResolver) and every write request,
 * so the client is never the only line of defence. `categoryType` and `pinned`
 * are NOT here: the parent comes from the route, and pinned "All …" rows are
 * seeded/managed by the system, never toggled from this form.
 */

// "" / null / undefined → null (no image). Otherwise a Cloudinary URL or a
// root-relative /images asset. Images are optional (only Flower/Explore use them).
const optionalImage = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z
    .string()
    .refine((v) => /^https?:\/\//.test(v) || v.startsWith('/'), 'Image must be a valid URL')
    .nullable()
);

const optionalHex = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Invalid HEX color format').nullable()
);

export const subcategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name must be at most 120 characters')
    .trim(),
  // Optional in the form — auto-derived from the name when blank (see slugify).
  // When supplied it must be a clean lower-kebab slug.
  slug: z
    .string()
    .max(255, 'Slug must be at most 255 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may contain only lowercase letters, numbers and hyphens')
    .optional(),
  image: optionalImage,
  imagePublicId: z.string().max(255).optional().nullable(),
  hoverColor: optionalHex,
  explore: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0, 'Display order must be 0 or greater').default(0),
  active: z.boolean().default(true),
});

/** Create payload = the editable fields + which fixed parent it belongs to. */
export const createSubcategorySchema = subcategorySchema.extend({
  categoryType: categoryTypeSchema,
});

/** PATCH payload — quick toggles (status / explore / order) without the full form. */
export const subcategoryPatchSchema = z
  .object({
    active: z.boolean().optional(),
    explore: z.boolean().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Nothing to update' });

/** Reorder payload — an ordered list of subcategory ids for drag-and-drop. */
export const subcategoryReorderSchema = z.object({
  ids: z.array(z.string().uuid('Invalid subcategory id')).min(1, 'No items to reorder'),
});

export type SubcategoryFormData = z.input<typeof subcategorySchema>;
export type SubcategoryInput = z.output<typeof subcategorySchema>;

/**
 * Normalise a name into a URL slug: lowercase, strip accents/punctuation,
 * collapse runs of non-alphanumerics to single hyphens, trim edge hyphens.
 *   "Mother's Day"   -> "mothers-day"
 *   "Love & Romance" -> "love-romance"
 *   "Ramadan & Eid"  -> "ramadan-eid"
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
