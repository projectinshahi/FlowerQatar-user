import { z } from 'zod';

const imageUrl = z
  .string()
  .url('Hover image must be a valid URL')
  .refine((url) => /^https?:\/\//i.test(url), 'Hover image must use HTTP(S)')
  .nullable()
  .optional()
  .transform((value) => value || null);

const name = z
  .string()
  .trim()
  .min(1, 'Subcategory name is required')
  .max(100, 'Subcategory name must be at most 100 characters');

const hoverColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Must be a valid hex color (e.g. #61000B)')
  .nullable()
  .optional()
  .transform((value) => value || null);

export const subcategorySchema = z.object({
  categoryId: z.string().uuid('Select a valid parent category'),
  name,
  hoverImage: imageUrl,
  bannerImage: imageUrl,
  showInNavigation: z.boolean().default(true),
  isCatchAll: z.boolean().default(false),
  isExploreGarden: z.boolean().default(false),
  hoverColor: hoverColor,
  isActive: z.boolean().default(true),
});

export const createSubcategorySchema = subcategorySchema;

/**
 * Inline row edits from the admin lists: one toggle or one image at a time.
 *
 * Every field must be genuinely absent-able. NOTE the deliberate use of a union here rather
 * than the `imageUrl` helper: that helper ends in `.transform(v => v || null)`, which runs
 * even when the key is missing — so reusing it would silently null the image on every
 * unrelated toggle PATCH. A union leaves an omitted key as `undefined`, which Prisma ignores.
 */
export const subcategoryPatchSchema = z
  .object({
    isActive: z.boolean().optional(),
    showInNavigation: z.boolean().optional(),
    isCatchAll: z.boolean().optional(),
    isExploreGarden: z.boolean().optional(),
    hoverImage: z.union([z.string().url('Hover image must be a valid URL'), z.null()]).optional(),
    bannerImage: z.union([z.string().url('Banner image must be a valid URL'), z.null()]).optional(),
    hoverColor: z.union([z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Must be a valid hex color'), z.null()]).optional(),
  })
  .strict();

/**
 * Drag-and-drop result: the full ordered list of ids for ONE section. Sending the whole
 * list (not a from/to pair) is what lets the server renumber 1..n and keep positions dense.
 */
export const subcategoryReorderSchema = z.object({
  section: z.enum(['navigation', 'garden']),
  ids: z.array(z.string().uuid()).min(1, 'Nothing to reorder').max(200),
});

export const subcategoryListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt', 'navigationPosition', 'gardenPosition'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SubcategoryFormData = z.input<typeof subcategorySchema>;
export type SubcategoryInput = z.output<typeof subcategorySchema>;
