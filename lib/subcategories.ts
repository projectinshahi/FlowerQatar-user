import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';
import type { CategoryType } from '@prisma/client';
import {
  CATEGORY_ORDER,
  CATEGORY_META,
  CATEGORY_FEATURES,
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

/**
 * A subcategory is listed only if it is active AND flagged for navigation.
 *
 * The "Show in Navigation" toggle exists only in the Flower admin form. Other categories no longer
 * offer it, so a flag left off there (e.g. Gift Combos → Perfume Combo) would hide the row with
 * no way to turn it back on; for those categories the flag is ignored.
 */
const NAV_FLAG_CATEGORIES = CATEGORY_ORDER.filter((c) => CATEGORY_FEATURES[c].explore);
const NAV_VISIBLE = {
  isActive: true,
  OR: [{ showInNavigation: true }, { category: { name: { notIn: NAV_FLAG_CATEGORIES } } }],
};

const emptyMenu = () =>
  Object.fromEntries(CATEGORY_ORDER.map((key) => [key, []])) as unknown as Record<
    CategoryType,
    StoreSubcategory[]
  >;

/**
 * Every nav-visible subcategory, grouped by category. Throws.
 *
 * Kept separate from the fallback below so the cache wraps the read and not the "return an
 * empty menu" catch — unstable_cache stores whatever its function returns, so one unreachable
 * moment would otherwise pin an empty navigation and empty listing filters in place for an
 * hour. A thrown result is never stored, so the next request just tries again.
 */
async function readMenuData(): Promise<Record<CategoryType, StoreSubcategory[]>> {
  const grouped = emptyMenu();
  for (const row of await prisma.subcategory.findMany({
    where: { ...NAV_VISIBLE, category: { isActive: true } },
    orderBy: [...NAV_ORDER],
    select,
  })) {
    const item = shape(row);
    if (item.categoryType in grouped) {
      grouped[item.categoryType].push(item);
    }
  }
  return grouped;
}

/*
 * Cached across requests, on the same tag the navigation menu uses — an admin's subcategory
 * write already purges it with expire: 0, so an edit is still live on the very next request.
 */
const loadMenuData = unstable_cache(readMenuData, ['nav-subcategories-v1'], {
  tags: [NAV_MENU_TAG],
  revalidate: 3600,
});

export const getMenuData = cache(
  async (): Promise<Record<CategoryType, StoreSubcategory[]>> => {
    try {
      return await loadMenuData();
    } catch (error) {
      logDbError('getMenuData', error);
      return emptyMenu();
    }
  }
);

/**
 * One category's subcategories, sliced out of that same cached read.
 *
 * This used to be its own findMany, uncached, and it is awaited before /shop?category=... can
 * send any HTML: measured at 1.46s — the round trip to a database in another region, not the
 * query — which held back the whole listing, its hero and every product image behind it. The
 * rows are the ones the navigation has already loaded and cached on every page of the site,
 * filtered by exactly the same conditions and ordered the same way, so reading them from there
 * returns precisely what the query did.
 */
export const getSubcategories = cache(
  async (categoryType: CategoryType): Promise<StoreSubcategory[]> =>
    (await getMenuData())[categoryType] ?? []
);

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
  ['nav-menu-v6'],
  { tags: [NAV_MENU_TAG], revalidate: 3600 }
);
