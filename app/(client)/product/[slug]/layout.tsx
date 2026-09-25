import { getPublishedProductSlugs } from '@/lib/store-products';

/**
 * Which product pages are built ahead of time.
 *
 * This used to map over PRODUCTS from data/products.ts — the hardcoded mock catalogue that
 * predates the admin. None of those 25 slugs exist in the database any more, so the build spent
 * its time pre-rendering 25 pages that render "Product Not Found" while every real product got
 * nothing and was generated on its first visit instead. Measured on real slugs, that first
 * visit cost 4.9–9.6s (the page's own query, then its related/reviews/gifts batch, each a round
 * trip to a database in another region) against 8–33ms once cached.
 *
 * Reading the published slugs from the database instead is the whole fix. Nothing else about
 * the page changes: it still fetches its own data the same way, and the catalogue is 48
 * products, so building them all is seconds of build time rather than a reason to be selective.
 *
 * `dynamicParams` is left at its default of true, which matters for two cases this must not
 * break: a product the admin creates after the build still renders on its first request, and a
 * slug that does not exist still reaches the page's own notFound() handling.
 */
export async function generateStaticParams() {
  const slugs = await getPublishedProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
