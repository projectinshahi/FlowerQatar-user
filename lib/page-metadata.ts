import type { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';

/**
 * Metadata helpers for static storefront pages.
 *
 * Eleven pages — including the home page — previously exported no metadata at all, so they
 * inherited the root layout's title and description verbatim. Search engines saw a dozen URLs
 * claiming to be the same page, which suppresses all of them.
 */

/**
 * An indexable content page: unique title + description, self-referencing canonical, and
 * Open Graph inherited from the root layout but overridden with this page's own copy.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  /** Bare title — the root layout's "%s | Lebami" template appends the brand. */
  title: string;
  description: string;
  /** Absolute path, e.g. "/about". Used for the canonical and the OG URL. */
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url: path,
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

/**
 * A private or transactional page: cart, checkout, account, wishlist, internal search.
 *
 * robots.txt already disallows crawling these, but that only asks a crawler not to FETCH the
 * page — a URL discovered from a link elsewhere can still be indexed without being crawled.
 * The meta directive is what actually keeps it out of the index, so both are needed.
 */
export function privatePageMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false },
    },
  };
}
