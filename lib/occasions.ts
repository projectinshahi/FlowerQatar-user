import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { mapDbProductToStore } from '@/lib/store-products';
import type { Product } from '@/types';

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
 * One query with nested includes (no N+1); `cache()` de-dupes within a request.
 * Occasions with no publishable products are dropped so the UI never renders an
 * empty section.
 */
export const getActiveOccasions = cache(async (): Promise<HomeOccasion[]> => {
  try {
    const rows = await prisma.occasion.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        products: {
          // Filter at the DB level — drafts/archived never reach the storefront.
          where: { product: { status: 'PUBLISHED' } },
          orderBy: { createdAt: 'asc' },
          include: { product: { include: { category: true } } },
        },
      },
    });

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
        products: o.products.map((op) => mapDbProductToStore(op.product)),
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
    const o = await prisma.occasion.findFirst({
      where: { slug, isActive: true },
      include: {
        products: {
          where: { product: { status: 'PUBLISHED' } },
          orderBy: { createdAt: 'asc' },
          include: { product: { include: { category: true } } },
        },
      },
    });
    if (!o) return null;
    return {
      id: o.id,
      title: o.title,
      slug: o.slug,
      subtitle: o.subtitle,
      description: o.description,
      bannerImage: o.bannerImage,
      buttonText: o.buttonText,
      buttonLink: o.buttonLink,
      products: o.products.map((op) => mapDbProductToStore(op.product)),
    };
  } catch (e) {
    console.error('Failed to load occasion:', e);
    return null;
  }
});
