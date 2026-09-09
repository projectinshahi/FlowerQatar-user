import { Suspense } from 'react';
import ShopClient from '../../../components/client/shop/ShopClient';
import BlushingBloomsClient from '../../../components/client/blushing-blooms/BlushingBloomsClient';
import BlushingListingSkeleton from '../../../components/client/blushing-blooms/BlushingListingSkeleton';
import { getStoreProducts, getSubcategoryBanner } from '../../../lib/store-products';
import { getBlushingBloomsContent } from '../../../lib/blushing-blooms';
import { getRatingSummaries } from '../../../lib/services/reviews';
import { categoryFromSlug, CATEGORY_META, PRODUCT_TABS } from '../../../lib/category-config';
import { PRODUCTS } from '../../../data/products';
import {
  parseFilters,
  reconcileFilters,
  deriveFacets,
  applyFilters,
  sortProducts,
} from '../../../lib/shop-facets';
import { BLUSHING_BLOOMS_FALLBACK } from '../../../data/blushing-blooms';
import type { Product } from '../../../types';

export const metadata = {
  title: 'Shop | The Collection',
  description: 'Explore our signature boxes of preserved Eternity® Roses, handcrafted to order.',
};

// Revalidate periodically so newly published products appear without a redeploy......
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
  const activeType = sp.category ? categoryFromSlug(sp.category) : null;

  /*
   * Blushing Blooms is the one category with its own page design, so it returns its own tree
   * instead of the shared shop listing. Handled here rather than on a dedicated route because
   * ?category=blushing-blooms is the URL the navbar and every existing link already point at.
   *
   * The branch is taken BEFORE any database call, and the data fetching lives in the component
   * below it. That ordering is what lets the dark skeleton stream first: the fallback is chosen
   * from the URL alone, so there is no frame in which the cream shop skeleton could appear.
   */
  if (activeType === 'BLUSHING_BLOOMS') {
    return (
      <Suspense fallback={<BlushingListingSkeleton />}>
        <BlushingBloomsListing />
      </Suspense>
    );
  }

  const dbProducts = await getStoreProducts();
  // Fall back to the curated mock catalog only if the DB has no published products yet.
  const all = dbProducts.length > 0 ? dbProducts : PRODUCTS;

  const str = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);
  // Apply the navbar-driven filters on the SERVER so the first paint is already correct
  // (no flash of unfiltered products). The sidebar/color/price/sort refine further on the client.
  let products = all;
  if (activeType) products = products.filter((p) => p.categoryType === activeType);
  if (sp.collection) products = products.filter((p) => p.collection === sp.collection);
  const tabField = sp.tab ? TAB_FIELD[sp.tab] : undefined;
  if (tabField) products = products.filter((p) => !!p[tabField]);

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

/**
 * Blushing Blooms listing data.
 *
 * Split out of ShopPage purely so the Suspense boundary above has something to await: every
 * database call for this category happens in here, which keeps the themed fallback on screen
 * for the whole wait rather than only after the queries resolve.
 *
 * Reads from `dbProducts` directly — the shared PRODUCTS mock carries no categoryType, so
 * filtering it by category would always yield nothing. With no published Blushing Blooms
 * products the page falls back to its own preview set.
 */
async function BlushingBloomsListing() {
  const [dbProducts, content] = await Promise.all([getStoreProducts(), getBlushingBloomsContent()]);
  const blushing = dbProducts.filter((p) => p.categoryType === 'BLUSHING_BLOOMS');
  const products = blushing.length > 0 ? blushing : BLUSHING_BLOOMS_FALLBACK;

  /*
   * Real ratings for the cards and the quick view. mapDbProductToStore hardcodes rating 5 /
   * reviewCount 0 for every product, which is fine where nothing renders them but would have
   * the quick view advertise a rating nobody gave. One aggregate query covers the whole grid;
   * products with no reviews keep the mapper's default and the quick view hides the count.
   */
  const ratings = await getRatingSummaries(products.map((p) => p.id).filter(Boolean));
  const rated = products.map((p) => {
    const r = ratings.get(p.id);
    return r ? { ...p, rating: r.average, reviewCount: r.count } : p;
  });

  return <BlushingBloomsClient products={rated} content={content} />;
}
