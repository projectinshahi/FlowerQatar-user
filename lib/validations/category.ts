import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters").trim(),
  image: z.string().url("Image must be a valid URL").min(1, "Image is required"),
  imagePublicId: z.string().min(1, "Image Public ID is required"),
  exploreMore: z.boolean().default(false),
  hoverColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, "Invalid HEX color format").min(1, "Hover Color is required"),
  status: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
