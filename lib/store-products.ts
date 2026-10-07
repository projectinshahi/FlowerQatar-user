import { cache } from "react";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logDbError } from "@/lib/prisma-error";
import type { Product, ProductColor } from "@/types";
import type { ProductVariant } from "@/types/product-detail";
import type { CategoryType } from "@prisma/client";
import { subcategoryHref } from "@/lib/category-config";
import { NAV_MENU_TAG } from "@/lib/subcategories";
import { galleryMedia, imagesOnly } from "@/lib/media";

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

/** The product columns mapDbProductToStore reads: a Prisma row, raw or serialized. */
export interface DbStoreProduct {
  id: string;
  slug: string;
  name: string;
  /** JSON column; anything that is not an array has no variants. */
  variants?: unknown;
  shortDescription?: string | null;
  description?: string | null;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
  categoryType?: string | null;
  country?: string | null;
  subcategory?: { id?: string; name?: string } | null;
}

export function mapDbProductToStore(db: DbStoreProduct): Product {
  const variants = (Array.isArray(db.variants) ? db.variants : []) as ProductVariant[];
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
      // Main media is the Color Swatch upload (image or video). Gallery Media is additional; its
      // first still only stands in for a colour with no swatch, so older products keep a photo.
      const cImage = c.swatchImage || cGallery[0] || c.hoverImage || PLACEHOLDER;
      // Hover media is the Hover Image upload (image or video). Without one, the first gallery still
      // that differs from the main media is the swap; with nothing different, no swap at all.
      const cHover = c.hoverImage || cGallery.find((u) => u !== cImage) || cImage;
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
        gallery: galleryMedia(c.galleryImages),
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
  const image = defColor?.swatchImage || gallery[0] || defColor?.hoverImage || PLACEHOLDER;
  const hoverImage = defColor?.hoverImage || gallery.find((u) => u !== image) || image;

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
    gallery: galleryMedia(defColor?.galleryImages),
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
    // Origin was fetched from the database but never mapped, so the shop could not filter
    // on it however the admin tagged products. Blank strings normalise to undefined so an
    // empty admin field does not become a facet value of "".
    country: db.country?.trim() || undefined,
  };
}

/**
 * The columns the storefront view-model needs. Keep in step with mapDbProductToStore: adding a
 * `db.x` read there without adding `x` here silently yields undefined.
 */
const STORE_PRODUCT_SELECT = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  description: true,
  country: true,
  categoryType: true,
  isNewArrival: true,
  isBestSeller: true,
  isTrending: true,
  isFeatured: true,
  variants: true,
  subcategory: { select: { id: true, name: true } },
} as const;

/**
 * Every published product's slug — i.e. which /product/[slug] pages actually exist.
 *
 * Used only by generateStaticParams, to decide what to pre-render. It deliberately does NOT go
 * through the cached catalogue: this runs at build time, it is wanted fresh, and it needs two
 * columns rather than the whole variants tree.
 *
 * Returns [] when the database cannot be reached, which is what keeps a build from failing over
 * a network blip — Next then pre-renders nothing and every page is generated on first request,
 * exactly as it behaved before this existed.
 */
export async function getPublishedProductSlugs(): Promise<string[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return rows.map((r) => r.slug).filter((slug): slug is string => Boolean(slug));
  } catch (e) {
    logDbError("getPublishedProductSlugs", e);
    return [];
  }
}

export const STORE_PRODUCTS_TAG = "store-products";

/**
 * Purge the cached catalogue. Call after ANY write to products (or to subcategory names, which
 * listings show). `expire: 0` makes the very next request read fresh data, so an admin sees
 * their edit immediately rather than one stale view later. Checkout never reads this cache:
 * cart and order prices are always re-read from the database.
 */
export function revalidateStoreProducts() {
  revalidateTag(STORE_PRODUCTS_TAG, { expire: 0 });
}

/*
 * The published catalogue, cached across requests (60s backstop) and purged on every product
 * write. /shop reads searchParams, which makes it dynamic, so its `revalidate = 60` never
 * applied and every visit re-read the whole catalogue from the database. The mapped list is
 * plain JSON (about 70KB for 48 products, no Dates), so it round-trips the cache unchanged.
 *
 * Errors are deliberately NOT caught in here: unstable_cache does not store a thrown result,
 * whereas returning [] on a database blip would cache an empty shop for a minute.
 */
const loadStoreProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const rows = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      // Exactly the columns mapDbProductToStore reads — nothing else. The unused scalars are
      // cheap, but `variants` is a JSON blob per row and this query feeds the shop, search and
      // the Blushing listing, so the wire cost is paid on every one of them.
      select: STORE_PRODUCT_SELECT,
    });
    return rows.map(mapDbProductToStore);
  },
  ["store-products-v1"],
  { tags: [STORE_PRODUCTS_TAG], revalidate: 60 }
);

/** All published products mapped for the storefront. cache() dedupes within a request. */
export const getStoreProducts = cache(async (): Promise<Product[]> => {
  try {
    return await loadStoreProducts();
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
type SubcategoryBanner = { name: string; image: string | null; categoryType: CategoryType };

/*
 * The read, throwing, cached per subcategory id (unstable_cache folds the arguments into the
 * key). Tagged with the navigation menu's tag, which an admin's subcategory write already
 * purges with expire: 0 — so renaming a subcategory or replacing its art still shows on the
 * next request. The catch stays outside, or a database blip would pin "no banner" in place.
 *
 * Worth caching because /shop is dynamic — it reads searchParams — so the page itself is never
 * cached, and every visit through the mega menu (?category=...&subcategory=...) awaited this
 * before it could send any HTML.
 */
const loadSubcategoryBanner = unstable_cache(
  async (id: string): Promise<SubcategoryBanner | null> => {
    const row = await prisma.subcategory.findFirst({
      where: { id, isActive: true, category: { isActive: true } },
      select: { name: true, bannerImage: true, hoverImage: true, category: { select: { name: true } } },
    });
    // Dedicated banner first; hoverImage is the fallback so a subcategory without a banner
    // still gets its own art rather than the generic marketing shot.
    // `categoryType` is the admin-owned parent, which the shop uses to scope a bare
    // ?subcategory= link to its own category.
    return row
      ? { name: row.name, image: row.bannerImage || row.hoverImage, categoryType: row.category.name as CategoryType }
      : null;
  },
  ["subcategory-banner-v1"],
  { tags: [NAV_MENU_TAG], revalidate: 3600 }
);

export const getSubcategoryBanner = cache(
  async (id: string): Promise<SubcategoryBanner | null> => {
    try {
      return await loadSubcategoryBanner(id);
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
 * Taken from the cached catalogue (already newest first), so it costs no query; the direct
 * read below is only the fallback for when the catalogue could not be loaded.
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
    const catalogue = await getStoreProducts();
    if (catalogue.length) {
      const others = catalogue.filter((p) => p.id !== productId);
      const pick = (match: (p: Product) => boolean) => others.filter(match).slice(0, limit);
      // Prefer the narrower subcategory match; fall back to the parent category.
      const rows = subcategoryId ? pick((p) => p.collection === subcategoryId) : pick((p) => p.categoryType === categoryType);
      return rows.length === 0 && subcategoryId && categoryType ? pick((p) => p.categoryType === categoryType) : rows;
    }
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
      href: subcategoryHref("FLOWER", c.id),
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
  // Admin controls the homepage: show ONLY products flagged "New Arrival" in the product
  // editor. If none are flagged, this returns an empty list and the section renders nothing.
  //
  // Asked of the database rather than by fetching the whole catalogue and filtering in JS —
  // the home page needs 8 rows, not all of them.
  let arrivals: Product[] = [];
  try {
    const rows = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        isNewArrival: true,
        // Blushing Blooms is never shown here — it has its own page, and the shop listing
        // already excludes it the same way. Written as an OR because a plain `not` on a
        // nullable column would also drop products that have no category at all.
        OR: [{ categoryType: null }, { categoryType: { not: "BLUSHING_BLOOMS" } }],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: STORE_PRODUCT_SELECT,
    });
    arrivals = rows.map(mapDbProductToStore);
  } catch (e) {
    logDbError("getNewArrivalItems", e);
    return [];
  }
  return arrivals.map((p) => ({
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
