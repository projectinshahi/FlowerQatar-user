/**
 * Metadata-only layout (the journal page is a Client Component). The journal used to sit outside
 * the (client) route group, so it rendered with no root layout at all: no <html lang>, no
 * <title>, no canonical, and none of the site's header or footer.
 */
import { pageMetadata } from '@/lib/page-metadata';

export const metadata = pageMetadata({
  title: 'Journal',
  description: 'Stories, gifting ideas and care guides from the Lebami atelier.',
  path: '/journal',
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
