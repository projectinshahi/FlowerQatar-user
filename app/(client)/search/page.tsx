import SearchClient from '../../../components/client/search/SearchClient';
import { getStoreProducts } from '../../../lib/store-products';
import { PRODUCTS } from '../../../data/products';

export const metadata = {
  title: 'Search | Lebami',
};

export const revalidate = 60;

export default async function SearchPage() {
  const dbProducts = await getStoreProducts();
  const products = dbProducts.length > 0 ? dbProducts : PRODUCTS;

  return <SearchClient products={products} />;
}
