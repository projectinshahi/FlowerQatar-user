import { notFound, permanentRedirect } from 'next/navigation';
import { categoryFromSlug, categorySlug } from '../../../lib/subcategories';

// The storefront funnels category browsing into the single /shop listing. This route
// stays only to redirect any old/bookmarked category links to the filtered shop.
export default async function CategoryRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { category } = await params;
  const { tab } = await searchParams;
  const type = categoryFromSlug(category);
  if (!type) notFound();

  const qs = new URLSearchParams({ category: categorySlug(type) });
  if (tab) qs.set('tab', tab);
  // Permanent (308): these are the old category URLs, and a temporary redirect told search
  // engines to keep indexing them instead of passing their signals to the /shop listing.
  permanentRedirect(`/shop?${qs.toString()}`);
}
