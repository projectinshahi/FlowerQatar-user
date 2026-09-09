import { Suspense } from 'react';
import ShopClient from '../../../components/client/shop/ShopClient';
import BlushingBloomsClient from '../../../components/client/blushing-blooms/BlushingBloomsClient';
import BlushingListingSkeleton from '../../../components/client/blushing-blooms/BlushingListingSkeleton';
import { getStoreProducts, getSubcategoryBanner } from '../../../lib/store-products';
import { getBlushingBloomsContent } from '../../../lib/blushing-blooms';
import { getRatingSummaries } from '../../../lib/services/reviews';
import { categoryFromSlug, CATEGORY_META, PRODUCT_TABS } from '../../../lib/category-config';
import { PRODUCTS } from '../../../data/products';
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

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; collection?: string; subcategory?: string; tab?: string }>;
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

  // Apply the navbar-driven filters on the SERVER so the first paint is already correct
  // (no flash of unfiltered products). The sidebar/color/price/sort refine further on the client.
  let products = all;
  if (activeType) products = products.filter((p) => p.categoryType === activeType);
  if (sp.collection) products = products.filter((p) => p.collection === sp.collection);
  const tabField = sp.tab ? TAB_FIELD[sp.tab] : undefined;
  if (tabField) products = products.filter((p) => !!p[tabField]);

  if (sp.subcategory) products = products.filter((p) => p.collection === sp.subcategory);

  /*
   * Banner. When the listing is narrowed to one subcategory the hero uses THAT subcategory's
   * admin-managed art and name; otherwise it falls back to the marketing image. Looked up by
   * id rather than read off the products so the banner still resolves when a subcategory has
   * no published products yet (an empty listing used to show the generic hero and title).
   */
  const activeSubcategoryId = sp.subcategory || sp.collection;
  const subcategory = activeSubcategoryId ? await getSubcategoryBanner(activeSubcategoryId) : null;

  const tabLabel = sp.tab ? PRODUCT_TABS.find((t) => t.slug === sp.tab)?.label : undefined;
  const heroTitle =
    subcategory?.name ||
    (activeType ? CATEGORY_META[activeType].label : undefined) ||
    tabLabel ||
    'The Collection';

  return (
    <ShopClient
      products={products}
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
