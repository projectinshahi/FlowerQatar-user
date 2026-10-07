import SearchClient from '../../../components/client/search/SearchClient';
import { getStoreProducts } from '../../../lib/store-products';

import { privatePageMetadata } from '@/lib/page-metadata';

// Internal search results: an unbounded set of near-duplicate URLs with no standalone value.
// noindex keeps them out of the index while `follow` still lets crawlers reach the products.
export const metadata = privatePageMetadata('Search');

export const revalidate = 60;

/*
 * Reading searchParams makes this route render per request rather than prerender. That is the
 * point: results for ?q= cannot exist in a prerendered page, so the static version was an empty
 * "Searching Atelier..." shell that the browser then replaced wholesale. It costs no database
 * work — getStoreProducts is served from the cached catalogue — and the page is noindex, so
 * nothing was being prerendered for search engines either.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const query = typeof sp.q === 'string' ? sp.q : '';

  const products = await getStoreProducts();

  return <SearchClient products={products} query={query} />;
}
