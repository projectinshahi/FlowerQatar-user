import { notFound, redirect } from 'next/navigation';
import { categoryFromSlug, getSubcategories } from '../../../../lib/subcategories';

// Subcategory browsing funnels into the single /shop listing, filtered by collection.
// This route stays only to redirect old/bookmarked subcategory links.
export default async function SubcategoryRedirect({
  params,
}: {
  params: Promise<{ category: string; sub: string }>;
}) {
  const { category, sub } = await params;
  const type = categoryFromSlug(category);
  if (!type) notFound();

  const current = (await getSubcategories(type)).find((s) => s.slug === sub && !s.pinned);
  if (!current) notFound();

  redirect(`/shop?collection=${current.slug}`);
}
