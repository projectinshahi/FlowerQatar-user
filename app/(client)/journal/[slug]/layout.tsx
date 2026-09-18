/**
 * Per-article metadata for the Client Component article page. Unknown slugs are noindex here;
 * the page itself calls notFound().
 */
import { notFound } from 'next/navigation';
import { pageMetadata } from '@/lib/page-metadata';
import { BLOG_POSTS } from '../../../../data/blog-posts';

/*
 * The articles are a fixed list, so they are pre-rendered and any other slug is rejected at
 * routing time with a real HTTP 404. A notFound() call during render could not do that: the
 * site layout has already started streaming a 200 by the time a nested segment runs.
 */
export const dynamicParams = false;
export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return { title: 'Article Not Found', robots: { index: false, follow: false } };
  return pageMetadata({ title: post.title, description: post.excerpt, path: `/journal/${post.slug}` });
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Checked in this Server Component, which runs before the page streams, so an unknown slug is
  // a real HTTP 404. notFound() inside the client page arrives after the shell and stays a 200.
  if (!BLOG_POSTS.some((p) => p.slug === slug)) notFound();
  return children;
}
