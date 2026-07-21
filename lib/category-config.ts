import type { CategoryType } from '@prisma/client';

/**
 * Client-safe configuration for the six FIXED categories. This module has NO server
 * imports (no Prisma), so it can be shared by client components, the navbar, and the
 * admin UI. The category set is a code constant — admins manage subcategories inside
 * these six, never the categories themselves.
 */

export type { CategoryType };

/** The six fixed categories, in navigation order. */
export const CATEGORY_ORDER: CategoryType[] = [
  'GIFT_COMBOS',
  'SHOP_BY_OCCASION',
  'BIRTHDAY',
  'FLOWER',
  'LUXURY_GIFTS',
  'EXPLORE',
];

/** Display label + base route (for SEO slug URLs) per category. */
export const CATEGORY_META: Record<CategoryType, { label: string; base: string }> = {
  GIFT_COMBOS: { label: 'Gift Combos', base: '/gift-combos' },
  SHOP_BY_OCCASION: { label: 'Shop By Occasion', base: '/shop-by-occasion' },
  BIRTHDAY: { label: 'Birthday', base: '/birthday' },
  FLOWER: { label: 'Flower', base: '/flowers' },
  LUXURY_GIFTS: { label: 'Luxury Gifts', base: '/luxury-gifts' },
  EXPLORE: { label: 'Explore', base: '/explore' },
};

/**
 * Which optional fields each category's subcategories use:
 *  - image:      visual menus (Flower cards, Explore tiles)
 *  - hoverColor: Flower cards tint on hover
 *  - explore:    Flower rows can feed the home "Explore Our Garden"
 * Text-only categories (Gift Combos, Occasion, Birthday, Luxury) use none.
 */
export const CATEGORY_FEATURES: Record<CategoryType, { image: boolean; hoverColor: boolean; explore: boolean }> = {
  GIFT_COMBOS: { image: false, hoverColor: false, explore: false },
  SHOP_BY_OCCASION: { image: false, hoverColor: false, explore: false },
  BIRTHDAY: { image: false, hoverColor: false, explore: false },
  FLOWER: { image: true, hoverColor: true, explore: true },
  LUXURY_GIFTS: { image: false, hoverColor: false, explore: false },
  EXPLORE: { image: true, hoverColor: false, explore: false },
};

/** The URL slug for a category (shared by the storefront and admin routes). */
export function categorySlug(categoryType: CategoryType): string {
  return CATEGORY_META[categoryType].base.replace(/^\//, '');
}

/** Reverse of categorySlug — resolve a route segment to a fixed category, or null. */
export function categoryFromSlug(slug: string): CategoryType | null {
  return CATEGORY_ORDER.find((c) => categorySlug(c) === slug) ?? null;
}

/** The shop URL for a whole category (shows every product in it). */
export function shopCategoryHref(categoryType: CategoryType): string {
  return `/shop?category=${categorySlug(categoryType)}`;
}

/**
 * Where a subcategory links: everything funnels to the single /shop listing, filtered.
 * The pinned "All …" row shows the whole category; others filter to their subcategory.
 */
export function subcategoryHref(categoryType: CategoryType, slug: string, pinned: boolean): string {
  return pinned ? shopCategoryHref(categoryType) : `/shop?collection=${slug}`;
}

/** A subcategory shaped for the storefront (with its resolved SEO href). */
export interface StoreSubcategory {
  id: string;
  categoryType: CategoryType;
  name: string;
  slug: string;
  image: string | null;
  hoverColor: string | null;
  explore: boolean;
  pinned: boolean;
  href: string;
}

/** How a category's mega-menu renders: text list, Flower image strip, or Explore tiles. */
export type MenuLayout = 'list' | 'strip' | 'tiles';

/** One clickable row inside a mega-menu. */
export interface NavItem {
  name: string;
  href: string;
  image: string | null;
  hoverColor: string | null;
}

/** A fixed category as consumed by the navbar (serializable — passed from server to client). */
export interface NavCategory {
  key: CategoryType;
  label: string;
  href: string;
  layout: MenuLayout;
  items: NavItem[];
  hero?: { image: string; alt: string; aspect?: string; width?: string };
}

/**
 * The four fixed product "collections" shown in the Flower mega-menu and as filter tabs
 * on the /flowers page. Each maps a URL `?tab=` slug to the Product boolean flag it filters.
 * Fixed in code — not admin-managed.
 */
export type ProductFlag = 'isBestSeller' | 'isTrending' | 'isNewArrival' | 'isFeatured';
export const PRODUCT_TABS: { slug: string; label: string; flag: ProductFlag }[] = [
  { slug: 'best-sellers', label: 'Best Sellers', flag: 'isBestSeller' },
  { slug: 'trending', label: 'Trending', flag: 'isTrending' },
  { slug: 'new-arrivals', label: 'New Arrivals', flag: 'isNewArrival' },
  { slug: 'featured', label: 'Featured', flag: 'isFeatured' },
];

/** Resolve a `?tab=` slug to its Product flag (null if unknown). */
export function flagForTab(slug: string | undefined): ProductFlag | null {
  return PRODUCT_TABS.find((t) => t.slug === slug)?.flag ?? null;
}

/** How each category's mega-menu is laid out (Flower = image strip, Explore = tiles). */
export const MENU_LAYOUT: Record<CategoryType, MenuLayout> = {
  GIFT_COMBOS: 'list',
  SHOP_BY_OCCASION: 'list',
  BIRTHDAY: 'list',
  FLOWER: 'strip',
  LUXURY_GIFTS: 'list',
  EXPLORE: 'tiles',
};
