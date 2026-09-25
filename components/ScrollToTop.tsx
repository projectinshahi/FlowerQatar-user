'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect } from 'react';

/**
 * Every route opens at the top.
 *
 * Next only scrolls on navigation when the committed frame actually has a DOM node for the new
 * segment; its layout-router bails out otherwise ("If there is no DOM node this layout-router
 * level is skipped"). /shop and /product/[slug] render `<Suspense fallback={null}>` in their
 * loading.tsx - deliberately, so no cream skeleton flashes ahead of the dark Blushing Blooms
 * theme - so their first committed frame has no node, the router returns without scrolling, and
 * nothing retries once the real content streams in: the previous page's offset survives the
 * navigation. Routes whose loading.tsx paints a skeleton straight away (/about) always worked,
 * which is why the bug looked arbitrary from the outside.
 *
 * Keyed on the PATHNAME alone. The shop writes its filters to the query string with
 * `scroll: false` on purpose, and those must keep the reader where they are.
 */

// Runs before paint, so a new page never shows a frame at the old offset. `useLayoutEffect`
// on its own warns when React renders this on the server, where no effect runs at all.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function ScrollToTop() {
  const pathname = usePathname();

  useIsomorphicLayoutEffect(() => {
    // Without this a refresh (and Back/Forward) restores the browser's remembered offset.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  }, []);

  useIsomorphicLayoutEffect(() => {
    // A #section link owns the scroll - natively, or through ScrollToHash on the home page.
    if (window.location.hash) return;
    // `instant`, never the default: globals.css sets `scroll-behavior: smooth` on <html>, which
    // would turn this into a visible glide down the old page - and a glide that streaming
    // content can abort halfway, leaving the reader stranded mid-page.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
