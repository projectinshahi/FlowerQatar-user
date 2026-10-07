import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import ShopClient from '../../../components/client/shop/ShopClient';
import BlushingBloomsClient from '../../../components/client/blushing-blooms/BlushingBloomsClient';
import BlushingListingSkeleton from '../../../components/client/blushing-blooms/BlushingListingSkeleton';
import { getStoreProducts, getSubcategoryBanner } from '../../../lib/store-products';
import { getSubcategories } from '../../../lib/subcategories';
import { getBlushingBloomsContent } from '../../../lib/blushing-blooms';
import { getRatingSummaries } from '../../../lib/services/reviews';
import { categoryFromSlug, categorySlug, CATEGORY_META, PRODUCT_TABS } from '../../../lib/category-config';
import {
  parseFilters,
  reconcileFilters,
  deriveFacets,
  applyFilters,
  sortProducts,
  UNASSIGNED_SUBCATEGORY,
} from '../../../lib/shop-facets';
import type { Product } from '../../../types';

/*
 * Per-listing metadata. A single static `metadata` gave every category the same title, and the
 * layout's canonical pointed all of them at the home page, so no listing could be indexed. The
 * canonical keeps category and subcategory (real, distinct listings) and drops sort, price,
 * country and tab, which only reorder or narrow the same set.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);
  const type = one('category') ? categoryFromSlug(one('category')!) : null;
  const sub = one('subcategory') || one('collection');
  const qs = new URLSearchParams();
  if (type) qs.set('category', categorySlug(type));
  if (type && sub) qs.set('subcategory', sub);
  const label = type ? CATEGORY_META[type].label : null;
  return {
    title: label ? `${label} | The Collection` : 'Shop | The Collection',
    description: label
      ? `Explore the ${label} collection from Lebami, handcrafted to order.`
      : 'Explore our signature boxes of preserved Eternity® Roses, handcrafted to order.',
    alternates: { canonical: qs.toString() ? `/shop?${qs.toString()}` : '/shop' },
  };
}

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
  const str = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);

  /* 1. SCOPE — the parent selection. Everything below is relative to this set. */
  const activeType = str('category') ? categoryFromSlug(str('category')!) : null;

  /*
   * A bare ?subcategory= link (old bookmark, /collections, any external link) carries no
   * category, which scoped the listing to the whole catalogue: the panel then offered every
   * category's subcategories and origins, and "All Subcategories" dropped the shopper into an
   * unscoped listing. The parent comes from the admin's Subcategory → Category relation, and
   * the redirect puts it in the URL so refresh, Back/Forward and the panel's own links all
   * stay inside that category.
   */
  const requestedSub = parseFilters(sp).subcategory;
  if (!activeType && requestedSub && requestedSub !== UNASSIGNED_SUBCATEGORY) {
    const parent = await getSubcategoryBanner(requestedSub);
    if (parent) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(sp)) if (typeof v === 'string') qs.set(k, v);
      qs.set('category', categorySlug(parent.categoryType));
      redirect(`/shop?${qs.toString()}`);
    }
  }

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

  /*
   * Two independent reads, issued together rather than one after the other: the subcategory
   * catalogue does not depend on the products. Awaited in sequence these were two separate
   * round trips to a remote database on the most trafficked listing page.
   */
  const [all, subcategoryRows] = await Promise.all([
    getStoreProducts(),
    activeType
      ? getSubcategories(activeType)
      : ([] as Awaited<ReturnType<typeof getSubcategories>>),
  ]);

  const tabKey = str('tab');
  const tabField = tabKey ? TAB_FIELD[tabKey] : undefined;

  let scoped = all;
  if (activeType) {
    scoped = scoped.filter((p) => p.categoryType === activeType);
  } else {
    /*
     * The all-products listing leaves out Blushing Blooms. That collection has its own page and
     * its own design (?category=blushing-blooms), and is shown only there. Filtering here —
     * before the facets are derived — keeps the side-panel counts in step with the grid.
     */
    scoped = scoped.filter((p) => p.categoryType !== "BLUSHING_BLOOMS");
  }
  if (tabField) scoped = scoped.filter((p) => !!p[tabField]);

  /*
   * Every published subcategory of this category, so the panel lists them all — including one
   * that holds nothing yet, which the products alone can't describe. Choosing it is a valid
   * (empty) listing rather than a filter the panel silently drops.
   *
   * A catch-all entry ("All Flowers") links to the whole category and owns no products, so it
   * would be a duplicate of the "All" row; its href carries no ?subcategory=, which is what
   * distinguishes it.
   */
  const catalogue = subcategoryRows
    .filter((s) => s.href.includes('subcategory='))
    .map((s) => ({ value: s.id, label: s.name }));

  /* 2. RECONCILE — a stale link or a category switch cannot leave a filter applied. */
  const { filters, dropped } = reconcileFilters(parseFilters(sp), scoped, catalogue);

  /* 3. DERIVE — options and counts for the panel. */
  const facets = deriveFacets(scoped, filters, catalogue);

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
 */
async function BlushingBloomsListing() {
  const [dbProducts, content, ratings] = await Promise.all([
    getStoreProducts(),
    getBlushingBloomsContent(),
    getRatingSummaries(),
  ]);
  const products = dbProducts.filter((p) => p.categoryType === 'BLUSHING_BLOOMS');

  /*
   * Real ratings for the cards and the quick view. mapDbProductToStore hardcodes rating 5 /
   * reviewCount 0 for every product, which is fine where nothing renders them but would have
   * the quick view advertise a rating nobody gave. One cached aggregate covers the whole grid;
   * products with no reviews keep the mapper's default and the quick view hides the count.
   */
  const rated = products.map((p) => {
    const r = ratings.get(p.id);
    return r ? { ...p, rating: r.average, reviewCount: r.count } : p;
  });

  return <BlushingBloomsClient products={rated} content={content} />;
}
