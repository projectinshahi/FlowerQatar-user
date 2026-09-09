import type { GalleryMedia } from '@/lib/media';

/**
 * Shape of the product row the detail page renders.
 *
 * `Product.variants` is a `jsonb` column, so Prisma types it as `JsonValue` and every consumer
 * reached for `any`. The schema already documents the shape in a comment; this is that comment
 * expressed as types, so the compiler enforces it instead of the reader remembering it.
 *
 * Deliberately tolerant of the fields being absent: rows created before a field existed simply
 * omit it, and the page must render those rather than crash. Nothing here is a validation
 * boundary — untrusted input is validated by the zod schemas in lib/validations.
 */

export interface ProductSpecification {
  id?: string;
  title: string;
  value: string;
}

/** Do / don't care instructions, authored per variant in the admin. */
export interface ProductCare {
  dos?: string[];
  donts?: string[];
}

export interface ProductColorVariant {
  id: string;
  colorName?: string;
  colorCode?: string | null;
  /** Serialized from Prisma Decimal, so it can arrive as a string. */
  price?: number | string | null;
  salePrice?: number | string | null;
  swatchImage?: string | null;
  hoverImage?: string | null;
  /** Stills and clips both; read through lib/media.ts, never by checking `type` directly. */
  galleryImages?: GalleryMedia[];
}

export interface ProductVariant {
  id: string;
  variantName?: string;
  sku?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  pros?: string[];
  cons?: string[];
  specifications?: ProductSpecification[];
  productCare?: ProductCare | null;
  colorVariants?: ProductColorVariant[];
}

/** The serialized Prisma row (Decimals and Dates already stringified) plus its subcategory. */
export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  country?: string | null;
  categoryType?: string | null;
  subcategory?: { id?: string; name?: string } | null;
  variants?: ProductVariant[];
}
