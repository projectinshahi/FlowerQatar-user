'use client';

import { useEffect } from 'react';
import { readLang } from '@/lib/translate';

const TRANSLATOR_SRC = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

/**
 * Injects Google's translator once; later calls do nothing. Called early for Arabic visitors,
 * on idle for everyone else, and by LanguageToggle the moment someone reaches for it.
 */
export function loadTranslator() {
  if (document.querySelector(`script[src="${TRANSLATOR_SRC}"]`)) return;
  type TranslateElement = { new (options: object, elementId: string): unknown; InlineLayout?: { SIMPLE: unknown } };
  const w = window as unknown as {
    googleTranslateElementInit: () => boolean;
    google?: { translate?: { TranslateElement?: TranslateElement } };
  };
  w.googleTranslateElementInit = function () {
    // element.js publishes window.google.translate before TranslateElement finishes
    // loading, so this callback can be reached while the constructor is still missing.
    // Bail instead of throwing — the caller retries.
    const T = w.google?.translate?.TranslateElement;
    if (!T || !T.InlineLayout) return false;
    new T(
      {
        pageLanguage: 'en',
        includedLanguages: 'en,ar',
        layout: T.InlineLayout.SIMPLE,
        autoDisplay: false,
      },
      'google_translate_element'
    );
    return true;
  };
  const script = document.createElement('script');
  script.src = TRANSLATOR_SRC;
  script.async = true;
  document.body.appendChild(script);
}

/**
 * Loads Google's website translator, restricted to English and Arabic.
 *
 * The widget's own "Select Language" dropdown is NOT shown. Google's markup can't be styled
 * to match the site and it used to float over the page bottom-left; instead the container is
 * kept in the DOM but visually hidden (the API needs a real element to mount into), and
 * <LanguageToggle> drives the hidden <select> it creates. See globals.css for the rules that
 * hide the widget chrome and the injected top banner.
 *
 * Loading is deferred for English visitors: the script chain no longer competes with the page
 * itself. Arabic visitors still get it immediately, since their page is masked until it
 * translates. A switch to Arabic before it has loaded uses LanguageToggle's reload fallback.
 */
export default function GoogleTranslate() {
  useEffect(() => {
    if (readLang() === 'ar') return loadTranslator();
    // Shortly after the page has fully loaded, so it never competes with the page itself.
    let timer: number | undefined;
    const afterLoad = () => {
      timer = window.setTimeout(loadTranslator, 1500);
    };
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, { once: true });
    return () => {
      window.removeEventListener('load', afterLoad);
      window.clearTimeout(timer);
    };
  }, []);

  // `inert`: the widget is visually hidden and aria-hidden, but Google's "Select Language"
  // link inside it was still a keyboard tab stop, an invisible control. The storefront's
  // own EN/AR switch drives translation, so nothing needs to reach this by keyboard.
  return <div id="google_translate_element" aria-hidden="true" inert />;
}
