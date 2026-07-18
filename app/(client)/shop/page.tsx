import ShopClient from '../../../components/client/shop/ShopClient';
import { getStoreProducts, getStoreCategories } from '../../../lib/store-products';
import { PRODUCTS } from '../../../data/products';

export const metadata = {
  title: 'Shop | The Collection',
  description: 'Explore our signature boxes of preserved Eternity® Roses, handcrafted to order.',
};

// Revalidate periodically so newly published products appear without a redeploy.
export const revalidate = 60;

export default async function ShopPage() {
  const [dbProducts, categories] = await Promise.all([getStoreProducts(), getStoreCategories()]);
  // Fall back to the curated mock catalog only if the DB has no published products yet.
  const products = dbProducts.length > 0 ? dbProducts : PRODUCTS;
  const categoryOptions = categories
    .filter((c) => c.productCount > 0)
    .map((c) => ({ name: c.name, slug: c.slug }));

  return <ShopClient products={products} categories={categoryOptions} />;
}
