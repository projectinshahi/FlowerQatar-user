import { z } from "zod";
import { hexColor } from "./color";

// Accepts absolute (Cloudinary) URLs or root-relative paths.
const mediaUrl = z
  .string()
  .min(1, "A video is required")
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/"), "Invalid video URL");

const bannerTextColor = z
  .union([hexColor, z.literal(""), z.null()])
  .transform((v) => (v === "" ? null : v))
  .optional();

export const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().max(255).optional().nullable(),
  subheading: z.string().max(255).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  /**
   * Per-element copy colours. Null (or an empty picker) means "use the storefront default",
   * which is white.
   *
   * `.optional()` comes LAST so an ABSENT key stays absent and Prisma leaves the column
   * alone. Ordering it before the transform would collapse undefined to null and silently
   * wipe a saved colour on any update that omits the field. Only an explicit "" clears it.
   */
  titleColor: bannerTextColor,
  subheadingColor: bannerTextColor,
  descriptionColor: bannerTextColor,
  videoUrl: mediaUrl,
  videoPublicId: z.string().max(255).optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.preprocess(
    (v) => (v === "" || v == null ? 0 : Number(v)),
    z.number().int().min(0).default(0)
  ),
});

export type BannerFormValues = z.infer<typeof bannerSchema>;
