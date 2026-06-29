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
  size: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  weight: z.coerce.number().optional().nullable(),
  length: z.coerce.number().optional().nullable(),
  width: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  salePrice: z.coerce.number().optional().nullable(),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  lowStockAlert: z.coerce.number().int().min(0).default(5),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
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
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  sku: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  basePrice: z.coerce.number().min(0, "Base price must be at least 0"),
  salePrice: z.coerce.number().optional().nullable(),
  comparePrice: z.coerce.number().optional().nullable(),
  costPrice: z.coerce.number().optional().nullable(),
  taxClass: z.string().optional().nullable(),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
  specifications: z.array(specificationSchema).default([]),
  faqs: z.array(faqSchema).default([]),
  seo: seoSchema.optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type VariantFormValues = z.infer<typeof variantSchema>;
