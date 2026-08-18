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
  title: 'Contact Us',
  description:
    'Get in touch with Lebami about an order, a bespoke arrangement or corporate gifting. We reply to every enquiry.',
  path: '/contact',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
