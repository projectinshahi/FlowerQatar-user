import ShopClient from '../../../components/client/shop/ShopClient';
import { getStoreProducts, getSubcategoryBanner } from '../../../lib/store-products';
import { categoryFromSlug, CATEGORY_META, PRODUCT_TABS } from '../../../lib/category-config';
import { PRODUCTS } from '../../../data/products';
import {
  parseFilters,
  reconcileFilters,
  deriveFacets,
  applyFilters,
  sortProducts,
} from '../../../lib/shop-facets';
import type { Product } from '../../../types';

export const metadata = {
  title: 'Shop | The Collection',
  description: 'Explore our signature boxes of preserved Eternity® Roses, handcrafted to order.',
};

// Revalidate periodically so newly published products appear without a redeploy.
export const revalidate = 60;

// Maps a ?tab= slug to the product flag it filters on.
const TAB_FIELD: Record<string, keyof Product> = {
  'best-sellers': 'isBestSeller',
  trending: 'isTrending',
  'new-arrivals': 'isNew',
  featured: 'isFeatured',
};

/**
 * The whole filter cycle runs here, in one pass, in a fixed order:
 *
 *   1. SCOPE     — category + tab decide which products the panel describes.
 *   2. RECONCILE — child values that cannot exist in that scope are dropped.
 *   3. DERIVE    — facets and counts come from the scope, counted against the surviving values.
 *   4. APPLY     — the grid is filtered and sorted with those same surviving values.
 *
 * Deriving before reconciling would offer options from the previous category; applying before
 * reconciling would render an empty grid whose filters the panel cannot display. The order is
 * the fix, and it is why filtering moved off the client entirely — the counts beside each
 * option and the products in the grid are now computed from one set of values, so they cannot
 * disagree.
 */
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const dbProducts = await getStoreProducts();
  // Fall back to the curated mock catalog only if the DB has no published products yet.
  const all = dbProducts.length > 0 ? dbProducts : PRODUCTS;

  const str = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);

  /* 1. SCOPE — the parent selection. Everything below is relative to this set. */
  const activeType = str('category') ? categoryFromSlug(str('category')!) : null;
  const tabKey = str('tab');
  const tabField = tabKey ? TAB_FIELD[tabKey] : undefined;

  let scoped = all;
  if (activeType) scoped = scoped.filter((p) => p.categoryType === activeType);
  if (tabField) scoped = scoped.filter((p) => !!p[tabField]);

  /* 2. RECONCILE — a stale link or a category switch cannot leave a filter applied. */
  const { filters, dropped } = reconcileFilters(parseFilters(sp), scoped);

  /* 3. DERIVE — options and counts for the panel. */
  const facets = deriveFacets(scoped, filters);

  /* 4. APPLY — the grid. */
  const products = sortProducts(applyFilters(scoped, filters), filters.sort);

  /*
   * Banner. When the listing is narrowed to one subcategory the hero uses THAT subcategory's
   * admin-managed art and name; otherwise it falls back to the marketing image. Looked up by
   * id rather than read off the products so the banner still resolves when a subcategory has
   * no published products yet (an empty listing used to show the generic hero and title).
   *
   * Reads the RECONCILED subcategory: a dropped one must not keep titling the page.
   */
  const subcategory = filters.subcategory ? await getSubcategoryBanner(filters.subcategory) : null;

  const tabLabel = tabKey ? PRODUCT_TABS.find((t) => t.slug === tabKey)?.label : undefined;
  const heroTitle =
    subcategory?.name ||
    (activeType ? CATEGORY_META[activeType].label : undefined) ||
    tabLabel ||
    'The Collection';

  return (
    <ShopClient
      products={products}
      facets={facets}
      filters={filters}
      dropped={dropped}
      heroTitle={heroTitle}
      heroImage={subcategory?.image ?? undefined}
    />
  );
}
