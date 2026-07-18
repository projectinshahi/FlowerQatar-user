import { z } from "zod";

// Accepts absolute (Cloudinary) URLs or root-relative paths.
const mediaUrl = z
  .string()
  .min(1, "A video is required")
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/"), "Invalid video URL");

export const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(255).optional().nullable(),
  subheading: z.string().max(255).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  videoUrl: mediaUrl,
  videoPublicId: z.string().max(255).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.preprocess(
    (v) => (v === "" || v == null ? 0 : Number(v)),
    z.number().int().min(0).default(0)
  ),
});

export type BannerFormValues = z.infer<typeof bannerSchema>;
