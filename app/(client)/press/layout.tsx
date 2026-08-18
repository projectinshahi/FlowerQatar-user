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
  title: 'Press & Media',
  description:
    'Press coverage, brand assets and media enquiries for Lebami preserved Eternity roses.',
  path: '/press',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
