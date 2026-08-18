import ShopClient from '../../../components/client/shop/ShopClient';
import { getStoreProducts, getSubcategoryBanner } from '../../../lib/store-products';
import { categoryFromSlug, CATEGORY_META, PRODUCT_TABS } from '../../../lib/category-config';
import { PRODUCTS } from '../../../data/products';
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

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; collection?: string; subcategory?: string; tab?: string }>;
}) {
  const sp = await searchParams;
  const dbProducts = await getStoreProducts();
  // Fall back to the curated mock catalog only if the DB has no published products yet.
  const all = dbProducts.length > 0 ? dbProducts : PRODUCTS;

  // Apply the navbar-driven filters on the SERVER so the first paint is already correct
  // (no flash of unfiltered products). The sidebar/color/price/sort refine further on the client.
  let products = all;
  const activeType = sp.category ? categoryFromSlug(sp.category) : null;
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
