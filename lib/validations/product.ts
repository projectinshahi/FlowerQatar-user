import { z } from "zod";

/**
 * All product data lives in a single Product row. Variants (and their nested color
 * variants, specifications and images) are validated here and persisted to the
 * `Product.variants` JSON column.
 */

// Treats "", null, undefined as "not provided". Otherwise coerces to a number.
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
  z.number().min(0, "Must be 0 or greater").nullable()
);

const requiredNumber = (label: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number({ error: `${label} is required` }).min(0, `${label} must be 0 or greater`)
  );

/**
 * A curated rating/review-count field: blank means "not curated", not zero.
 *
 * The admin inputs post strings, and an untouched number input posts "", which `Number("")`
 * would silently turn into 0 — publishing a 0-star rating for every product saved without
 * touching the field. Empty therefore normalises to null, which is what the detail page reads
 * as "fall back to the real reviews".
 */
const curatedNumber = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), schema.nullable())
    .optional();

// Accepts absolute URLs (Cloudinary uploads) OR root-relative paths (local /images or /videos assets).
const imageUrl = z
  .string()
  .min(1, "Media URL is required")
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/"), "Invalid media URL");

export const galleryImageSchema = z.object({
  id: z.string().optional(),
  url: imageUrl,
  publicId: z.string().min(1, "Public ID is required").optional().default(""),
  isPrimary: z.boolean().default(false),
  order: z.number().default(0),
  type: z.enum(["image", "video"]).optional().default("image"),
});

export const colorVariantSchema = z
  .object({
    id: z.string().optional(),
    colorName: z.string().trim().min(1, "Color name is required").max(100, "Color name is too long"),
    // Hex, like the category and subcategory schemas already require - this value is written
    // straight into a style attribute, so a free-form string is neither safe nor renderable.
    colorCode: z
      .string()
      .trim()
      .min(1, "Color code is required")
      .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Enter a valid hex color, e.g. #F5E1E1"),
    price: requiredNumber("Price"),
    salePrice: optionalNumber,
    swatchImage: z.string().optional().nullable(),
    hoverImage: z.string().optional().nullable(),
    galleryImages: z.array(galleryImageSchema).default([]),
    isActive: z.boolean().default(true),
    isDefault: z.boolean().default(false),
  })
  // A sale price above the original is not a discount. Most read paths clamp it themselves, but
  // subscription pricing takes salePrice verbatim, so it has to be rejected at the source.
  .refine((c) => c.salePrice == null || c.salePrice <= c.price, {
    message: "Sale price must be less than or equal to the price",
    path: ["salePrice"],
  });

export const specificationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Specification title is required"),
  value: z.string().min(1, "Specification value is required"),
});

export const variantSchema = z.object({
  id: z.string().optional(),
  variantName: z.string().min(1, "Variant name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().optional().nullable(),
  productCare: z
    .object({
      dos: z.array(z.string().min(1)).default([]),
      donts: z.array(z.string().min(1)).default([]),
    })
    .default({ dos: [], donts: [] }),
  specifications: z.array(specificationSchema).default([]),
  colorVariants: z
    .array(colorVariantSchema)
    .min(1, "At least one color variant is required"),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const productSchema = z.object({
  id: z.string().optional(),
  // Optional by design: the action falls back to the first variant's name. Trimmed and bounded
  // to the VarChar(255)/VarChar(100) columns so an over-long value is a field error, not a 500.
  name: z.string().trim().max(255, "Name is too long").optional(),
  slug: z.string().trim().max(255, "URL slug is too long").optional(),
  sku: z.string().trim().max(100, "SKU is too long").optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  // Category system: one of the four fixed categories + a subcategory within it.
  categoryType: z
    .enum(["GIFT_COMBOS", "SHOP_BY_OCCASION", "FLOWER", "BLUSHING_BLOOMS"])
    .optional()
    .nullable(),
  // "" is what the admin select posts for "no subcategory"; anything else must be a real id.
  subcategoryId: z.string().uuid("Select a valid subcategory").or(z.literal("")).optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),

  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),

  // Curated rating shown on the product detail page. Half stars are allowed (4.5), which is
  // why this is not an int; the DB CHECK enforces the same 1-5 range.
  rating: curatedNumber(
    z.number().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5")
  ),

  variants: z.array(variantSchema).min(1, "At least one variant is required"),
})
  // A product may carry at most ONE marketing flag. If several are set, keep the
  // first (priority order) and clear the rest — enforced for create + update.
  .transform((d) => {
    const first = (["isFeatured", "isBestSeller", "isTrending", "isNewArrival"] as const).find((f) => d[f]);
    return {
      ...d,
      isFeatured: first === "isFeatured",
      isBestSeller: first === "isBestSeller",
      isTrending: first === "isTrending",
      isNewArrival: first === "isNewArrival",
    };
  });

export type ProductFormValues = z.infer<typeof productSchema>;
export type VariantFormValues = z.infer<typeof variantSchema>;
export type ColorVariantFormValues = z.infer<typeof colorVariantSchema>;
