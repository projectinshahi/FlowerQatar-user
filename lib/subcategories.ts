import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';
import type { CategoryType } from '@prisma/client';
import {
  CATEGORY_ORDER,
  CATEGORY_META,
  MENU_LAYOUT,
  subcategoryHref,
  shopCategoryHref,
  type StoreSubcategory,
  type NavCategory,
} from '@/lib/category-config';

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

export const NAV_MENU_TAG = 'nav-menu';

const MENU_HERO: Partial<Record<CategoryType, NonNullable<NavCategory['hero']>>> = {
  GIFT_COMBOS: {
    image: '/images/category_gift_boxes_1782290153364.png',
    alt: 'Luxury gift combo',
  },
  SHOP_BY_OCCASION: {
    image: '/images/occation.png',
    alt: 'Luxury gifting',
  },
  FLOWER: {
    image: '/images/category_bouquets_1782290106325.png',
    alt: 'Luxury bouquet',
  },
  BLUSHING_BLOOMS: {
    image: '/images/category_gift_boxes_1782290153364.png',
    alt: 'Blushing blooms',
  },
};

type Row = {
  id: string;
  name: string;
  hoverImage: string | null;
  isCatchAll: boolean;
  category: { name: string };
};

const typeFor = (name: string) => name as CategoryType;

/**
 * A catch-all entry ("All Flowers") links to the WHOLE parent category, not to itself.
 *
 * It holds no products of its own, so filtering by its id returned an empty listing — the
 * strip's first tile appeared to show nothing. Driven by the admin's `isCatchAll` flag rather
 * than by matching on the name, so the label can be renamed freely.
 */
const shape = (row: Row): StoreSubcategory => {
  const categoryType = typeFor(row.category.name);
  return {
    id: row.id,
    categoryType,
    name: row.name,
    hoverImage: row.hoverImage,
    href: row.isCatchAll ? shopCategoryHref(categoryType) : subcategoryHref(categoryType, row.id),
  };
};

const select = {
  id: true,
  name: true,
  hoverImage: true,
  isCatchAll: true,
  category: { select: { name: true } },
} as const;

/**
 * Admin ordering for the category strip. `name` only breaks ties between rows that share a
 * position (possible right after a subcategory is created), so the output is always stable.
 */
const NAV_ORDER = [{ navigationPosition: 'asc' }, { name: 'asc' }] as const;

/** A subcategory is in the strip only if it is active AND flagged for navigation. */
const NAV_VISIBLE = { isActive: true, showInNavigation: true } as const;

export const getSubcategories = cache(
  async (categoryType: CategoryType): Promise<StoreSubcategory[]> => {
    try {
      return (
        await prisma.subcategory.findMany({
          where: {
            ...NAV_VISIBLE,
            category: { name: categoryType, isActive: true },
          },
          orderBy: [...NAV_ORDER],
          select,
        })
      ).map(shape);
    } catch (error) {
      logDbError('getSubcategories', error);
      return [];
    }
  }
);

export const getMenuData = cache(
  async (): Promise<Record<CategoryType, StoreSubcategory[]>> => {
    const empty = Object.fromEntries(
      CATEGORY_ORDER.map((key) => [key, []])
    ) as unknown as Record<CategoryType, StoreSubcategory[]>;

    try {
      for (const row of await prisma.subcategory.findMany({
        where: { ...NAV_VISIBLE, category: { isActive: true } },
        orderBy: [...NAV_ORDER],
        select,
      })) {
        const item = shape(row);
        if (item.categoryType in empty) {
          empty[item.categoryType].push(item);
        }
      }
    } catch (error) {
      logDbError('getMenuData', error);
    }
    return empty;
  }
);

export const getExploreFlowers = cache(async () => getSubcategories('FLOWER'));

export async function getAdminSubcategoryOptions(): Promise<
  { id: string; categoryType: CategoryType; name: string }[]
> {
  try {
    return (
      await prisma.subcategory.findMany({
        where: { isActive: true, category: { isActive: true } },
        orderBy: { name: 'asc' },
        select,
      })
    ).map((s) => ({
      id: s.id,
      categoryType: typeFor(s.category.name),
      name: s.name,
    }));
  } catch (error) {
    logDbError('getAdminSubcategoryOptions', error);
    return [];
  }
}

export const getNavMenu = unstable_cache(
  async (): Promise<NavCategory[]> => {
    const grouped = await getMenuData();
    return CATEGORY_ORDER.map((key) => ({
      key,
      label: CATEGORY_META[key].label,
      href: shopCategoryHref(key),
      layout: MENU_LAYOUT[key],
      hero: MENU_HERO[key],
      /*
       * Blushing Blooms deliberately publishes no menu items.
       *
       * Its subcategories belong to the filter panel on its own page, which derives them from
       * the products actually listed there — not to a hover panel on the main site, where they
       * would offer the storefront's cream mega menu as the way into a category that owns its
       * whole dark surface.
       *
       * Emptying `items` here rather than special-casing the Navbar is what makes the label
       * behave everywhere at once: `cat.items.length > 0` is the single condition the desktop
       * trigger, its click handler and the mobile drawer all read, so all three fall back to a
       * plain link straight to the category. Every other category is untouched.
       */
      items:
        key === 'BLUSHING_BLOOMS'
          ? []
          : (grouped[key] || []).map((s) => ({
              name: s.name,
              href: s.href,
              image: s.hoverImage,
              hoverImage: s.hoverImage,
            })),
    }));
  },
  /*
   * The cache key carries a version.
   *
   * This entry stores fully-built hrefs, so a change to how a link is COMPUTED (rather than
   * to the underlying rows) does not invalidate it — the tag only fires on subcategory
   * writes. Adding `isCatchAll` routing meant the cache kept serving the old
   * "?subcategory=<id>" link for All Flowers even though the code had changed.
   *
   * Bump this suffix whenever the shape or link logic below changes.
   */
  ['nav-menu-v4'],
  { tags: [NAV_MENU_TAG], revalidate: 3600 }
);
