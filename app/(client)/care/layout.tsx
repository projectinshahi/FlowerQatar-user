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
  title: 'Flower Care Guide',
  description:
    'How to care for preserved Eternity roses: light, humidity, handling and cleaning, so your arrangement stays beautiful for a year or longer.',
  path: '/care',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
