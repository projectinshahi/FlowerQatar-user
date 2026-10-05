import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { getStoreProducts, mapDbProductToStore } from '@/lib/store-products';
import type { Product } from '@/types';

/** An occasion's published products, as ids only: the products come from the cached catalogue. */
const PRODUCT_IDS = {
  // Filter at the DB level — drafts/archived never reach the storefront.
  where: { product: { status: 'PUBLISHED' as const } },
  orderBy: { createdAt: 'asc' as const },
  select: { productId: true },
};

/** Resolves product ids through the catalogue, keeping their order; reads directly if it is empty. */
async function productsById(ids: string[], catalogue: Product[]): Promise<Map<string, Product>> {
  if (!ids.length) return new Map();
  // getStoreProducts returns [] when its read fails.
  if (catalogue.length) return new Map(catalogue.map((p) => [p.id, p]));
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, status: 'PUBLISHED' },
    include: { subcategory: true },
  });
  return new Map(rows.map((r) => [r.id, mapDbProductToStore(r)]));
}

/**
 * Storefront view of an admin-managed Occasion.
 *
 * Products are mapped through `mapDbProductToStore` because price / image / rating
 * are not columns — they are derived from the Product.variants JSON. This also gives
 * us exactly the shape the shared <ProductCard /> already consumes.
 */
export interface HomeOccasion {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string | null;
  bannerImage: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  products: Product[];
}

/** Copy/CTA for the home teaser — no products, so the query stays cheap. */
export interface FeaturedOccasion {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string | null;
  bannerImage: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  productCount: number;
}

/**
 * Active occasions in the admin's display order, each with its published products.
 * No N+1; `cache()` de-dupes within a request.
 * Occasions with no publishable products are dropped so the UI never renders an
 * empty section.
 */
export const getActiveOccasions = cache(async (): Promise<HomeOccasion[]> => {
  try {
    const [rows, catalogue] = await Promise.all([
      prisma.occasion.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        include: { products: PRODUCT_IDS },
      }),
      getStoreProducts(),
    ]);
    const byId = await productsById(rows.flatMap((o) => o.products.map((op) => op.productId)), catalogue);

    return rows
      .map((o) => ({
        id: o.id,
        title: o.title,
        slug: o.slug,
        subtitle: o.subtitle,
        description: o.description,
        bannerImage: o.bannerImage,
        buttonText: o.buttonText,
        buttonLink: o.buttonLink,
        products: o.products.flatMap((op) => byId.get(op.productId) ?? []),
      }))
      .filter((o) => o.products.length > 0);
  } catch (e) {
    console.error('Failed to load occasions:', e);
    return [];
  }
});

/**
 * The single collection promoted above New Arrivals: active + featured, lowest
 * display order wins. Uses `_count` instead of loading products — the teaser only
 * needs copy, an image and a CTA. Returns null when the admin hasn't featured one,
 * so the section simply doesn't render.
 */
export const getFeaturedOccasion = cache(async (): Promise<FeaturedOccasion | null> => {
  try {
    const o = await prisma.occasion.findFirst({
      where: {
        isActive: true,
        isFeatured: true,
        // Never promote a collection with nothing to show.
        products: { some: { product: { status: 'PUBLISHED' } } },
      },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        subtitle: true,
        description: true,
        bannerImage: true,
        buttonText: true,
        buttonLink: true,
        _count: { select: { products: true } },
      },
    });
    if (!o) return null;
    const { _count, ...rest } = o;
    return { ...rest, productCount: _count.products };
  } catch (e) {
    console.error('Failed to load featured occasion:', e);
    return null;
  }
});

/** One active collection with its published products — for /occasion/[slug]. */
export const getOccasionBySlug = cache(async (slug: string): Promise<HomeOccasion | null> => {
  try {
    const [o, catalogue] = await Promise.all([
      prisma.occasion.findFirst({ where: { slug, isActive: true }, include: { products: PRODUCT_IDS } }),
      getStoreProducts(),
    ]);
    if (!o) return null;
    const byId = await productsById(o.products.map((op) => op.productId), catalogue);
    return {
      id: o.id,
      title: o.title,
      slug: o.slug,
      subtitle: o.subtitle,
      description: o.description,
      bannerImage: o.bannerImage,
      buttonText: o.buttonText,
      buttonLink: o.buttonLink,
      products: o.products.flatMap((op) => byId.get(op.productId) ?? []),
    };
  } catch (e) {
    console.error('Failed to load occasion:', e);
    return null;
  }
});
