import SearchClient from '../../../components/client/search/SearchClient';
import { getStoreProducts } from '../../../lib/store-products';
import { PRODUCTS } from '../../../data/products';

import { privatePageMetadata } from '@/lib/page-metadata';

// Internal search results: an unbounded set of near-duplicate URLs with no standalone value.
// noindex keeps them out of the index while `follow` still lets crawlers reach the products.
export const metadata = privatePageMetadata('Search');

export const revalidate = 60;

export default async function SearchPage() {
  const dbProducts = await getStoreProducts();
  const products = dbProducts.length > 0 ? dbProducts : PRODUCTS;

  return <SearchClient products={products} />;
}
