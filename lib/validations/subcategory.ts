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
  isExploreGarden: z.boolean().default(false),
  hoverColor: hoverColor,
  isActive: z.boolean().default(true),
});

export const createSubcategorySchema = subcategorySchema;
export const subcategoryPatchSchema = z
  .object({
    isActive: z.boolean().optional(),
    isExploreGarden: z.boolean().optional(),
    hoverColor: hoverColor.optional(),
  })
  .strict();

export const subcategoryListQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SubcategoryFormData = z.input<typeof subcategorySchema>;
export type SubcategoryInput = z.output<typeof subcategorySchema>;
