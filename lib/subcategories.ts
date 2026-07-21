import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';
import type { CategoryType, Prisma } from '@prisma/client';
import {
  CATEGORY_ORDER,
  CATEGORY_META,
  MENU_LAYOUT,
  subcategoryHref,
  shopCategoryHref,
  type StoreSubcategory,
  type NavCategory,
} from '@/lib/category-config';

// Re-export the client-safe config so server callers can import everything from one place.
export {
  CATEGORY_ORDER,
  CATEGORY_META,
  CATEGORY_FEATURES,
  categorySlug,
  categoryFromSlug,
  subcategoryHref,
  shopCategoryHref,
  type StoreSubcategory,
  type NavCategory,
} from '@/lib/category-config';

/** Cache tag for the navbar menu — busted whenever a subcategory is written. */
export const NAV_MENU_TAG = 'nav-menu';

/**
 * Decorative hero art per category (the image on the right of a mega-menu). These are
 * branding assets, not admin-managed data — kept in code so the menus look identical to
 * before. Explore has no hero (it renders image tiles instead).
 */
const MENU_HERO: Partial<Record<CategoryType, NonNullable<NavCategory['hero']>>> = {
  GIFT_COMBOS: { image: '/images/category_gift_boxes_1782290153364.png', alt: 'Luxury gift combo with flowers, chocolates and elegant wrapping' },
  SHOP_BY_OCCASION: { image: '/images/occation.png', alt: 'Elegant luxury gifting moment for every occasion' },
  BIRTHDAY: { image: '/images/category_chocolates_1782290122821.png', alt: 'Premium birthday celebration with cake, flowers and gift boxes' },
  FLOWER: {
    image: '/images/category_bouquets_1782290106325.png',
    alt: 'Luxury bouquet of roses, lilies and tulips',
    // Source is 1024×1024 — a square box keeps it uncropped without dominating the panel.
    aspect: 'aspect-square',
    width: 'w-[200px] md:w-[230px] lg:w-[260px]',
  },
  LUXURY_GIFTS: { image: '/images/category_gift_boxes_1782290153364.png', alt: 'Curated luxury gift collection' },
};

type Row = {
  id: string;
  categoryType: CategoryType;
  name: string;
  slug: string;
  image: string | null;
  hoverColor: string | null;
  explore: boolean;
  pinned: boolean;
};

function shape(s: Row): StoreSubcategory {
  return {
    id: s.id,
    categoryType: s.categoryType,
    name: s.name,
    slug: s.slug,
    image: s.image,
    hoverColor: s.hoverColor,
    explore: s.explore,
    pinned: s.pinned,
    href: subcategoryHref(s.categoryType, s.slug, s.pinned),
  };
}

// Pinned "All …" always first, then the admin's display order.
const STORE_ORDER: Prisma.SubcategoryOrderByWithRelationInput[] = [
  { pinned: 'desc' },
  { displayOrder: 'asc' },
  { name: 'asc' },
];
const STORE_SELECT = {
  id: true,
  categoryType: true,
  name: true,
  slug: true,
  image: true,
  hoverColor: true,
  explore: true,
  pinned: true,
} as const;

/** Active subcategories for one category, ordered (pinned first). Cached per request. */
export const getSubcategories = cache(async (categoryType: CategoryType): Promise<StoreSubcategory[]> => {
  try {
    const rows = await prisma.subcategory.findMany({
      where: { categoryType, active: true },
      orderBy: STORE_ORDER,
      select: STORE_SELECT,
    });
    return rows.map(shape);
  } catch (e) {
    logDbError(`getSubcategories(${categoryType})`, e);
    return [];
  }
});

/**
 * All active subcategories grouped by category, in navigation order — powers the DB-driven
 * mega-menus. One query, then grouped in memory (no N+1). Cached per request.
 */
export const getMenuData = cache(async (): Promise<Record<CategoryType, StoreSubcategory[]>> => {
  const empty = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, [] as StoreSubcategory[]])) as Record<
    CategoryType,
    StoreSubcategory[]
  >;
  try {
    const rows = await prisma.subcategory.findMany({
      where: { active: true },
      orderBy: STORE_ORDER,
      select: STORE_SELECT,
    });
    for (const r of rows) empty[r.categoryType].push(shape(r));
    return empty;
  } catch (e) {
    logDbError('getMenuData', e);
    return empty;
  }
});

/** Flowers flagged for "Explore Our Garden" on the home page (explore = true), ordered. */
export const getExploreFlowers = cache(async (): Promise<StoreSubcategory[]> => {
  try {
    const rows = await prisma.subcategory.findMany({
      where: { categoryType: 'FLOWER', active: true, explore: true, pinned: false },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: STORE_SELECT,
    });
    return rows.map(shape);
  } catch (e) {
    logDbError('getExploreFlowers', e);
    return [];
  }
});

/**
 * Flat list of active subcategories for admin selectors (product editor). Not cached —
 * the admin always sees the current set. The client filters by the chosen category.
 */
export async function getAdminSubcategoryOptions(): Promise<
  { id: string; categoryType: CategoryType; name: string }[]
> {
  try {
    return await prisma.subcategory.findMany({
      where: { active: true },
      orderBy: [{ categoryType: 'asc' }, { pinned: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, categoryType: true, name: true },
    });
  } catch (e) {
    logDbError('getAdminSubcategoryOptions', e);
    return [];
  }
}

/**
 * The full navbar menu (all six categories with their subcategories), shaped for the
 * client Navbar and cached across requests under NAV_MENU_TAG so pages stay statically
 * renderable — the tag is revalidated whenever a subcategory changes. On DB error it
 * returns the six empty categories, so the navbar always renders its top-level labels.
 */
export const getNavMenu = unstable_cache(
  async (): Promise<NavCategory[]> => {
    let byType: Record<CategoryType, StoreSubcategory[]>;
    try {
      const rows = await prisma.subcategory.findMany({
        where: { active: true },
        orderBy: STORE_ORDER,
        select: STORE_SELECT,
      });
      byType = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, [] as StoreSubcategory[]])) as Record<
        CategoryType,
        StoreSubcategory[]
      >;
      for (const r of rows) byType[r.categoryType].push(shape(r));
    } catch (e) {
      logDbError('getNavMenu', e);
      byType = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, [] as StoreSubcategory[]])) as Record<
        CategoryType,
        StoreSubcategory[]
      >;
    }

    return CATEGORY_ORDER.map((key) => ({
      key,
      label: CATEGORY_META[key].label,
      href: shopCategoryHref(key),
      layout: MENU_LAYOUT[key],
      hero: MENU_HERO[key],
      items: byType[key].map((s) => ({ name: s.name, href: s.href, image: s.image, hoverColor: s.hoverColor })),
    }));
  },
  ['nav-menu'],
  { tags: [NAV_MENU_TAG], revalidate: 3600 }
);
