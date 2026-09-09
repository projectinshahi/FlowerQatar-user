import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { logDbError } from "@/lib/prisma-error";
import type { Product, ProductColor } from "@/types";
import type { CategoryType } from "@prisma/client";
import type { ProductFlag } from "@/lib/category-config";
import { imagesOnly } from "@/lib/media";

/**
 * Maps a DB product (single-table with nested `variants` JSON) into the storefront
 * `Product` view-model the client components already consume. This lets the shop,
 * search, home carousels, etc. render real DB products without changing their UI.
 */

const PLACEHOLDER = "/images/category_bouquets_1782290106325.png";

function pickDefault<T extends { isDefault?: boolean }>(arr: T[] | undefined): T | undefined {
  if (!arr || arr.length === 0) return undefined;
  return arr.find((x) => x.isDefault) || arr[0];
}

export function mapDbProductToStore(db: any): Product {
  const variants: any[] = Array.isArray(db.variants) ? db.variants : [];
  const defVariant = pickDefault(variants);
  const allColors = variants.flatMap((v) => v?.colorVariants || []);
  const defColor = pickDefault(defVariant?.colorVariants) || allColors[0];

  const price = Number(defColor?.price ?? 0);
  const sale = defColor?.salePrice != null ? Number(defColor.salePrice) : null;
  const onSale = sale != null && sale < price;

  // Unique colors across all variants for the swatch row. Each color carries its own
  // image so the UI can swap the product photo when a swatch is selected.
  const seen = new Set<string>();
  const colors: ProductColor[] = [];
  for (const c of allColors) {
    if (c?.colorName && !seen.has(c.colorName)) {
      seen.add(c.colorName);
      // Cards render in <img>, so stills only — a clip would show as a broken thumbnail.
      const cGallery: string[] = imagesOnly(c.galleryImages).map((g) => g.url!);
      const cImage = cGallery[0] || c.swatchImage || c.hoverImage || PLACEHOLDER;
      const cHover = cGallery[1] || c.hoverImage || cImage;
      // Per-colour pricing, mirroring the default-variant maths above so a colour on sale
      // reports its sale price rather than its list price.
      const cPrice = Number(c.price ?? 0);
      const cSale = c.salePrice != null ? Number(c.salePrice) : null;
      const cOnSale = cSale != null && cSale < cPrice;
      colors.push({
        name: c.colorName,
        hex: c.colorCode || "#000000",
        image: cImage,
        hoverImage: cHover,
        price: cOnSale ? cSale! : cPrice,
        originalPrice: cOnSale ? cPrice : undefined,
      });
    }
  }
  // Keep the default color first so it matches the product's primary image.
  if (defColor?.colorName) {
    const di = colors.findIndex((c) => c.name === defColor.colorName);
    if (di > 0) {
      const [d] = colors.splice(di, 1);
      colors.unshift(d);
    }
  }

  const gallery: string[] = imagesOnly(defColor?.galleryImages).map((g) => g.url!);
  const image = gallery[0] || defColor?.swatchImage || defColor?.hoverImage || PLACEHOLDER;
  const hoverImage = gallery[1] || defColor?.hoverImage || image;

  const badge = db.isNewArrival
    ? "New"
    : db.isBestSeller
    ? "Best Seller"
    : db.isTrending
    ? "Trending"
    : undefined;

  return {
    id: db.id,
    slug: db.slug,
    name: db.name,
    price: onSale ? sale! : price,
    originalPrice: onSale ? price : undefined,
    // Browsing key: stable subcategory id (no URL slug is stored for subcategories).
    // Display code must use `collectionName` — this is a UUID.
    collection: db.subcategory?.id || "signature",
    collectionName: db.subcategory?.name || undefined,
    colors,
    image,
    hoverImage,
    images: gallery.length ? gallery : [image],
    badge,
    rating: 5,
    reviewCount: 0,
    description: db.shortDescription || db.description || "",
    isNew: !!db.isNewArrival,
    isBestSeller: !!db.isBestSeller,
    isTrending: !!db.isTrending,
    isFeatured: !!db.isFeatured,
    categoryType: db.categoryType ?? undefined,
  };
}

/** All published products mapped for the storefront. cache() dedupes within a request. */
export const getStoreProducts = cache(async (): Promise<Product[]> => {
  try {
    const rows = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: { subcategory: true },
    });
    return rows.map(mapDbProductToStore);
  } catch (e) {
    logDbError("getStoreProducts", e);
    return [];
  }
});

/**
 * Name + banner art for one subcategory, for the shop hero when the listing is filtered to it.
 *
 * Uses the subcategory's own `bannerImage` (wide art, uploaded in Category System), falling
 * back to `hoverImage` when none is set. Returns null for an unknown id so the caller can fall
 * back to the default hero.
 */
export const getSubcategoryBanner = cache(
  async (id: string): Promise<{ name: string; image: string | null } | null> => {
    try {
      const row = await prisma.subcategory.findFirst({
        where: { id, isActive: true, category: { isActive: true } },
        select: { name: true, bannerImage: true, hoverImage: true },
      });
      // Dedicated banner first; hoverImage is the fallback so a subcategory without a banner
      // still gets its own art rather than the generic marketing shot.
      return row ? { name: row.name, image: row.bannerImage || row.hoverImage } : null;
    } catch (e) {
      logDbError(`getSubcategoryBanner(${id})`, e);
      return null;
    }
  }
);

/**
 * "You may also like": published products from the SAME subcategory, falling back to the same
 * fixed category when the subcategory is thin. Never returns unrelated products, and never
 * the product being viewed.
 *
 * One indexed query (subcategoryId / categoryType are both indexed), taken on the server so
 * the product page makes no extra client request.
 */
export const getRelatedProducts = cache(
  async (
    productId: string,
    subcategoryId: string | null,
    categoryType: CategoryType | null,
    limit = 6
  ): Promise<Product[]> => {
    // No category information at all → nothing is genuinely "related", so show nothing.
    if (!subcategoryId && !categoryType) return [];
    try {
      const rows = await prisma.product.findMany({
        where: {
          status: "PUBLISHED",
          id: { not: productId },
          // Prefer the narrower subcategory match; fall back to the parent category.
          ...(subcategoryId ? { subcategoryId } : { categoryType: categoryType! }),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { subcategory: true },
      });

      // A subcategory with nothing else in it widens to the parent category — still related,
      // never a random product from an unrelated one.
      if (rows.length === 0 && subcategoryId && categoryType) {
        const wider = await prisma.product.findMany({
          where: { status: "PUBLISHED", id: { not: productId }, categoryType },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: { subcategory: true },
        });
        return wider.map(mapDbProductToStore);
      }
      return rows.map(mapDbProductToStore);
    } catch (e) {
      logDbError(`getRelatedProducts(${productId})`, e);
      return [];
    }
  }
);

/**
 * Published products in a fixed category, optionally narrowed to one subcategory and/or
 * a "collection" flag (best sellers / trending / new arrivals / featured). Powers the SEO
 * category/subcategory listing pages and their tab filters. cache() dedupes per request.
 */
export const getProductsByCategory = cache(
  async (categoryType: CategoryType, subcategoryId?: string, flag?: ProductFlag): Promise<Product[]> => {
    try {
      const rows = await prisma.product.findMany({
        where: {
          status: "PUBLISHED",
          categoryType,
          ...(subcategoryId ? { subcategoryId } : {}),
          ...(flag ? { [flag]: true } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: { subcategory: true },
      });
      return rows.map(mapDbProductToStore);
    } catch (e) {
      logDbError(`getProductsByCategory(${categoryType})`, e);
      return [];
    }
  }
);

export interface StoreCategory {
  id: string;
  name: string;
  key: string;
  image: string;
  productCount: number;
}

/**
 * Active subcategories with published-product counts, for the shop filter chips and
 * the /collections grid. Now sourced from the new subcategory system (was the legacy
 * Category table). The shop matches these slugs against each product's `collection`.
 */
export const getStoreCategories = cache(async (): Promise<StoreCategory[]> => {
  try {
    const subs = await prisma.subcategory.findMany({
      where: { isActive: true, category: { isActive: true } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        hoverImage: true,
        _count: { select: { products: { where: { status: "PUBLISHED" } } } },
      },
    });
    return subs.map((s) => ({
      id: s.id,
      name: s.name,
      key: s.id,
      image: s.hoverImage || PLACEHOLDER,
      productCount: s._count.products,
    }));
  } catch (e) {
    logDbError("getStoreCategories", e);
    return [];
  }
});

/** Parse "#RGB"/"#RRGGBB" into [r,g,b]; null if not a hex color. */
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** A translucent overlay color (matches the original rgba(…, 0.85) hover look). */
function toOverlayColor(hex: string): string {
  const rgb = parseHex(hex);
  return rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.85)` : "rgba(0, 0, 0, 0.6)";
}

/** Pick black or white label text for readable contrast over the hover color. */
function contrastText(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return "#FFFFFF";
  // Perceived luminance (ITU-R BT.601).
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return lum > 0.6 ? "#111111" : "#FFFFFF";
}


export interface ExploreGardenItem {
  id: string;
  name: string;
  image: string;
  hoverColor: string; // ready-to-use rgba() overlay
  textColor: string; // contrasting label color
  href: string; // SEO route to the flower subcategory
}

/**
 * Flower subcategories the admin flagged "Show in home garden" (explore=true, active),
 * shaped for the home "Explore Our Garden" grid. Replaces the legacy category source.
 */
export const getExploreGardenItems = cache(async (): Promise<ExploreGardenItem[]> => {
  try {
    const rows = await prisma.subcategory.findMany({
      where: {
        isActive: true,
        isExploreGarden: true,
        category: { name: "FLOWER", isActive: true },
      },
      // Garden order is admin-owned and independent of the navigation strip's order.
      orderBy: [{ gardenPosition: "asc" }, { name: "asc" }],
      select: { id: true, name: true, hoverImage: true, hoverColor: true },
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      image: c.hoverImage || PLACEHOLDER,
      hoverColor: toOverlayColor(c.hoverColor || "#61000B"),
      textColor: contrastText(c.hoverColor || "#61000B"),
      href: `/shop?subcategory=${c.id}`,
    }));
  } catch (e) {
    logDbError("getExploreGardenItems", e);
    return [];
  }
});

export interface NewArrivalSwatch {
  name: string;
  hex: string;
  image: string;
  hoverImage: string;
}

export interface NewArrivalItem {
  id: string;
  slug: string;
  badge: string;
  name: string;
  price: number;
  rating: number;
  swatches: NewArrivalSwatch[];
  image: string;
  hoverImage: string;
}

/** Products shaped for the home New Arrivals carousel (prefers new arrivals). */
export async function getNewArrivalItems(limit = 8): Promise<NewArrivalItem[]> {
  const products = await getStoreProducts();
  // Admin controls the homepage: show ONLY products flagged "New Arrival" in the product
  // editor. If none are flagged, this returns an empty list and the section renders nothing.
  const arrivals = products.filter((p) => p.isNew);
  return arrivals.slice(0, limit).map((p) => ({
    id: p.id,
    slug: p.slug,
    badge: p.badge || "New",
    name: p.name,
    price: p.price,
    rating: p.rating,
    // Each swatch carries its own image so clicking it swaps the card photo.
    swatches: p.colors.slice(0, 6).map((c) => ({
      name: c.name,
      hex: c.hex,
      image: c.image || p.image,
      hoverImage: c.hoverImage || c.image || p.hoverImage,
    })),
    image: p.image,
    hoverImage: p.hoverImage,
  }));
}
