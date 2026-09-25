'use client';

import { useEffect } from 'react';

/**
 * Scroll to the #hash target once it actually exists.
 *
 * The home page streams its sections, so a link like /#membership arrives while that section
 * is still a Suspense skeleton: the router looks for the element, finds nothing, and the
 * fragment is silently dropped — the visitor lands at the top of the page instead. This waits
 * for the element to appear and then scrolls to it, allowing for the fixed header.
 *
 * It never fights the visitor: the first wheel, touch or key scroll cancels it, and it gives
 * up after a few seconds if the section never arrives.
 */
export default function ScrollToHash() {
  useEffect(() => {
    let cleanup: (() => void) | null = null;

    const run = () => {
      cleanup?.();
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;

      const scrollTo = (el: HTMLElement) => {
        // The header is fixed; --site-header-h is what the rest of the site offsets by.
        const header =
          parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-h')) || 0;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - header - 8, behavior: 'smooth' });
      };

      const target = document.getElementById(id);
      if (target) {
        scrollTo(target);
        return;
      }

      // Not rendered yet — watch for it, bounded in time and cancelled by any real scroll.
      const observer = new MutationObserver(() => {
        const el = document.getElementById(id);
        if (el) {
          stop();
          scrollTo(el);
        }
      });
      const stop = () => {
        observer.disconnect();
        clearTimeout(timer);
        window.removeEventListener('wheel', stop);
        window.removeEventListener('touchmove', stop);
        window.removeEventListener('keydown', stop);
        cleanup = null;
      };

      observer.observe(document.body, { childList: true, subtree: true });
      const timer = setTimeout(stop, 5000);
      window.addEventListener('wheel', stop, { passive: true });
      window.addEventListener('touchmove', stop, { passive: true });
      window.addEventListener('keydown', stop);
      cleanup = stop;
    };

    run();
    // Clicking the same anchor again while already here changes only the hash.
    window.addEventListener('hashchange', run);
    return () => {
      window.removeEventListener('hashchange', run);
      cleanup?.();
    };
  }, []);

  return null;
}
