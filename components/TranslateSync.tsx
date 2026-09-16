'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  applyAttrs,
  collectAttrs,
  endTransition,
  isTranslatorNoise,
  readLang,
  whenTranslated,
} from '@/lib/translate';

/** Google's pass over newly added nodes lands in roughly a second; copy attributes back after. */
const ATTR_SETTLE_MS = 1500;

/**
 * Keeps attribute text translated, and owns the fade that hides the untranslated frame.
 *
 * Google's widget translates content that appears after load on its own — streamed sections,
 * drawers, modals, route changes. This component must never re-initialise it: clearing
 * #google_translate_element and constructing a new TranslateElement does not re-read `googtrans`,
 * it only tears the widget down. Doing that on every DOM change (every carousel tick) is what
 * kept Arabic pages churning and dropping content back to English.
 *
 * What Google can't translate is attribute text (placeholders, aria-labels, alt), so that is the
 * only thing handled here — see the attribute pool in lib/translate.ts.
 *
 * The masking attribute is set pre-paint by the inline script in layout.tsx; this component
 * clears it once the first pass has landed.
 */
export default function TranslateSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // First paint: the inline script already masked the body. Wait for Google, then reveal.
  useEffect(() => {
    if (readLang() !== 'ar') {
      endTransition();
      return;
    }

    let cancelled = false;

    // Register attribute text NOW, before element.js gets to run. Google applies the cookie
    // itself during startup, and that native path is the dependable one — we just want the
    // hidden pool to already be in the DOM when it happens.
    collectAttrs();

    // whenTranslated always resolves (it has a timeout), so the page can never stay masked.
    whenTranslated().then(() => {
      if (cancelled) return;
      applyAttrs();
      endTransition();
    });

    return () => {
      cancelled = true;
      endTransition();
    };
  }, []);

  /*
   * Late-arriving content: Google translates its text by itself. Mirror any new attribute text
   * into the pool so it is translated alongside, then copy the result back. No fade — this fires
   * during normal browsing, and the widget itself is never touched.
   */
  useEffect(() => {
    if (readLang() !== 'ar') return;

    let cancelled = false;
    let debounce = 0;

    const observer = new MutationObserver((records) => {
      if (records.every(isTranslatorNoise)) return;

      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        collectAttrs();
        window.setTimeout(() => !cancelled && applyAttrs(), ATTR_SETTLE_MS);
      }, 400);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearTimeout(debounce);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = readLang();
  }, [pathname, searchParams]);

  return null;
}
