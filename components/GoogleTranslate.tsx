'use client';

import { useEffect } from 'react';
import { loadTranslator, readLang, SOURCE_LANG } from '@/lib/translate';

/**
 * Loads Google's website translator, limited to the languages in lib/translate.ts.
 *
 * The widget's own "Select Language" dropdown is NOT shown. Google's markup can't be styled
 * to match the site and it used to float over the page bottom-left; instead the container is
 * kept in the DOM but visually hidden (the API needs a real element to mount into), and
 * <LanguageToggle> drives the hidden <select> it creates. See globals.css for the rules that
 * hide the widget chrome and the injected top banner.
 *
 * Loading is deferred for source-language visitors so the script chain never competes with the
 * page itself. Visitors in another language get it immediately, since Google is what translates
 * their page. A switch made before it has loaded starts it (see selectLanguage).
 */
export default function GoogleTranslate() {
  useEffect(() => {
    if (readLang() !== SOURCE_LANG) return loadTranslator();
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
  // own language switch drives translation, so nothing needs to reach this by keyboard.
  return <div id="google_translate_element" aria-hidden="true" inert />;
}
