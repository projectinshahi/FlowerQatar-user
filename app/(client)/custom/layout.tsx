/**
 * Metadata-only layout.
 *
 * The page itself is a Client Component, and Next.js does not allow a `metadata` export from
 * one. A thin Server Component layout is the supported way to give a client page its own
 * title, description and canonical — without this the page silently inherits the root
 * layout's copy, which is what made a dozen URLs look identical to search engines.
 */
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata({
  title: 'Bespoke Arrangements',
  description:
    'Build a custom preserved rose arrangement — choose the box shape, rose colour, lid finish and a hand-finished personal message.',
  path: '/custom',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
