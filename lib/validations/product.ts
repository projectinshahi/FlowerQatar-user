import { z } from "zod";

export const variantImageSchema = z.object({
  id: z.string().optional(),
  url: z.string().url("Invalid image URL"),
  publicId: z.string().min(1, "Public ID is required"),
  isPrimary: z.boolean().default(false),
  isHover: z.boolean().default(false),
  isGallery: z.boolean().default(true),
  order: z.number().default(0),
});

export const variantSchema = z.object({
  id: z.string().optional(),
  variantName: z.string().min(1, "Variant name is required"),
  sku: z.string().min(1, "SKU is required"),
  color: z.string().optional().nullable(),
  colorCode: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  weight: z.coerce.number().optional().nullable(),
  length: z.coerce.number().optional().nullable(),
  width: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  salePrice: z.coerce.number().optional().nullable(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  
  description: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  productCare: z.string().optional().nullable(),
  hoverImage: z.string().min(1, "Hover image is required"),
  videoUrl: z.string().optional().nullable(),
  swatchImage: z.string().optional(),
  
  images: z.array(variantImageSchema).default([]),
});

export const specificationSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  value: z.string().min(1, "Value is required"),
});

export const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
});

export const seoSchema = z.object({
  seoTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  keywords: z.string().optional().nullable(),
});

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),

  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  specifications: z.array(specificationSchema).default([]),
  faqs: z.array(faqSchema).default([]),
  seo: seoSchema.optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type VariantFormValues = z.infer<typeof variantSchema>;
