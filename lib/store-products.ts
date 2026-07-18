import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Product, ProductColor } from "@/types";

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
      const cGallery: string[] = (c.galleryImages || []).map((g: { url?: string }) => g?.url).filter(Boolean);
      const cImage = cGallery[0] || c.swatchImage || c.hoverImage || PLACEHOLDER;
      const cHover = cGallery[1] || c.hoverImage || cImage;
      colors.push({ name: c.colorName, hex: c.colorCode || "#000000", image: cImage, hoverImage: cHover });
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

  const gallery: string[] = (defColor?.galleryImages || []).map((g: any) => g?.url).filter(Boolean);
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
    collection: db.category?.slug || "signature",
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
  };
}

/** All published products mapped for the storefront. cache() dedupes within a request. */
export const getStoreProducts = cache(async (): Promise<Product[]> => {
  try {
    const rows = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
    return rows.map(mapDbProductToStore);
  } catch (e) {
    console.error("Failed to load store products:", e);
    return [];
  }
});

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

/** Active categories with their published-product counts, for storefront browsing. */
export const getStoreCategories = cache(async (): Promise<StoreCategory[]> => {
  try {
    const cats = await prisma.category.findMany({
      where: { status: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        _count: { select: { products: { where: { status: "PUBLISHED" } } } },
      },
    });
    return cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      productCount: c._count.products,
    }));
  } catch (e) {
    console.error("Failed to load store categories:", e);
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

export interface ExploreCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  hoverColor: string; // ready-to-use rgba() overlay
  textColor: string; // contrasting label color
}

/**
 * Categories the admin flagged "Explore More" (exploreMore=true) and left active,
 * for the home "Explore Our Gardens" section. Ordered by the admin's display order.
 */
export const getExploreCategories = cache(async (): Promise<ExploreCategory[]> => {
  try {
    const cats = await prisma.category.findMany({
      where: { status: true, exploreMore: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true, slug: true, image: true, hoverColor: true },
    });
    return cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      hoverColor: toOverlayColor(c.hoverColor),
      textColor: contrastText(c.hoverColor),
    }));
  } catch (e) {
    console.error("Failed to load explore categories:", e);
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
  subtitle: string;
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
    subtitle: (p.collection || "signature").toUpperCase().replace(/-/g, " "),
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
