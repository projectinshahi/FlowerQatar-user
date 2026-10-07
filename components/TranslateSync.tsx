'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  applyAttrs,
  applyDocumentLanguage,
  collectAttrs,
  isTranslatorNoise,
  readLang,
  SOURCE_LANG,
  subscribeLang,
  whenTranslated,
} from '@/lib/translate';

/** Google's pass over newly added nodes lands in roughly a second; copy attributes back after. */
const ATTR_SETTLE_MS = 1500;

/**
 * Keeps <html lang/dir> and attribute text in step with the selected language.
 *
 * Google's widget translates content that appears after load on its own — streamed sections,
 * drawers, modals, route changes. This component must never re-initialise it: clearing
 * #google_translate_element and constructing a new TranslateElement does not re-read `googtrans`,
 * it only tears the widget down. Doing that on every DOM change (every carousel tick) is what
 * kept Arabic pages churning and dropping content back to English.
 *
 * What Google can't translate is attribute text (placeholders, aria-labels, alt), so that is
 * handled here — see the attribute pool in lib/translate.ts.
 */
export default function TranslateSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lang = useSyncExternalStore(subscribeLang, readLang, () => SOURCE_LANG);

  // Register attribute text before Google's first pass, and copy the translations back after.
  useEffect(() => {
    if (lang === SOURCE_LANG) return;
    let cancelled = false;
    collectAttrs();
    whenTranslated().then(() => !cancelled && applyAttrs());
    return () => {
      cancelled = true;
    };
  }, [lang]);

  /*
   * Late-arriving content: Google translates its text by itself. Mirror any new attribute text
   * into the pool so it is translated alongside, then copy the result back. The widget itself
   * is never touched.
   */
  useEffect(() => {
    if (lang === SOURCE_LANG) return;

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
  }, [lang]);

  // A navigation must never put <html> back into another language or direction.
  useEffect(() => {
    applyDocumentLanguage(readLang());
  }, [pathname, searchParams, lang]);

  return null;
}
