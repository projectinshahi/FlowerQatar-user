import type { CategoryType } from '@prisma/client';

/**
 * Client-safe configuration for the four FIXED categories:
 * - GIFT_COMBOS (Gift Combos, /gift-combos)
 * - SHOP_BY_OCCASION (Shop By Occasion, /shop-by-occasion)
 * - FLOWER (Flowers, /flowers)
 * - BLUSHING_BLOOMS (Blushing Blooms, /blushing-blooms)
 *
 * This module has NO server imports (no Prisma), so it can be shared by client components,
 * the navbar, and the admin UI.
 */

export type { CategoryType };

/** Immutable parent categories. Admins can manage their subcategories only. */
export const FIXED_CATEGORY_TYPES: CategoryType[] = [
  'GIFT_COMBOS',
  'SHOP_BY_OCCASION',
  'FLOWER',
  'BLUSHING_BLOOMS',
];

export const fixedCategoryLabel = (category: string) =>
  ({
    GIFT_COMBOS: 'Gift Combos',
    SHOP_BY_OCCASION: 'Shop By Occasion',
    FLOWER: 'Flowers',
    BLUSHING_BLOOMS: 'Blushing Blooms',
  } as Record<string, string>)[category] ?? category;

/** The four fixed categories, in navigation order. */
export const CATEGORY_ORDER: CategoryType[] = [
  'GIFT_COMBOS',
  'SHOP_BY_OCCASION',
  'FLOWER',
  'BLUSHING_BLOOMS',
];

/** Display label + base route (for SEO slug URLs) per category. */
export const CATEGORY_META: Record<CategoryType, { label: string; base: string }> = {
  GIFT_COMBOS: { label: 'Gift Combos', base: '/gift-combos' },
  SHOP_BY_OCCASION: { label: 'Shop By Occasion', base: '/shop-by-occasion' },
  FLOWER: { label: 'Flower', base: '/flowers' },
  BLUSHING_BLOOMS: { label: 'Blushing Blooms', base: '/blushing-blooms' },
};

/**
 * Which optional fields each category's subcategories use:
 *  - image:      visual menus (Flower cards)
 *  - hoverColor: Flower cards tint on hover
 *  - explore:    Flower rows can feed the home "Explore Our Garden"
 */
export const CATEGORY_FEATURES: Record<
  CategoryType,
  { image: boolean; hoverColor: boolean; explore: boolean }
> = {
  GIFT_COMBOS: { image: false, hoverColor: false, explore: false },
  SHOP_BY_OCCASION: { image: false, hoverColor: false, explore: false },
  FLOWER: { image: true, hoverColor: true, explore: true },
  BLUSHING_BLOOMS: { image: false, hoverColor: false, explore: false },
};

/**
 * Which categories use a product's "Country of Origin / Sourcing".
 *
 * Separate from CATEGORY_FEATURES on purpose: that map describes SUBCATEGORY fields, this one
 * describes a PRODUCT field. Sourcing origin is meaningful for fresh stems and not for gift
 * boxes or combos, so the field is hidden elsewhere rather than left blank.
 */
export const CATEGORIES_WITH_COUNTRY: CategoryType[] = ['FLOWER'];

export function supportsCountry(categoryType: string | null | undefined): boolean {
  return !!categoryType && CATEGORIES_WITH_COUNTRY.includes(categoryType as CategoryType);
}

/** The URL slug for a category (shared by the storefront and admin routes). */
export function categorySlug(categoryType: CategoryType): string {
  return CATEGORY_META[categoryType].base.replace(/^\//, '');
}

/** Reverse of categorySlug — resolve a route segment to a fixed category, or null. */
export function categoryFromSlug(slug: string): CategoryType | null {
  return (CATEGORY_ORDER.find((c) => categorySlug(c) === slug) as CategoryType) ?? null;
}

/** The shop URL for a whole category (shows every product in it). */
export function shopCategoryHref(categoryType: CategoryType): string {
  return `/shop?category=${categorySlug(categoryType)}`;
}

/**
 * Where a subcategory links: everything funnels to the single /shop listing, filtered.
 *
 * The parent category is always in the URL. Without it the listing scoped to the whole
 * catalogue, so the filter panel offered every category's subcategories and origins.
 */
export function subcategoryHref(categoryType: CategoryType, id: string): string {
  return `/shop?category=${categorySlug(categoryType)}&subcategory=${id}`;
}

/** A subcategory shaped for the storefront (with its resolved SEO href). */
export interface StoreSubcategory {
  id: string;
  categoryType: CategoryType;
  name: string;
  hoverImage: string | null;
  href: string;
}

/** How a category's mega-menu renders: text list, Flower image strip, or tiles. */
export type MenuLayout = 'list' | 'strip' | 'tiles';

/** One clickable row inside a mega-menu. */
export interface NavItem {
  name: string;
  href: string;
  image: string | null;
  hoverImage: string | null;
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

/** How each category's mega-menu is laid out. */
export const MENU_LAYOUT: Record<CategoryType, MenuLayout> = {
  GIFT_COMBOS: 'list',
  SHOP_BY_OCCASION: 'list',
  FLOWER: 'strip',
  BLUSHING_BLOOMS: 'list',
};
