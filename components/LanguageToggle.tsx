'use client';

import { useSyncExternalStore } from 'react';
import { LANGUAGES, SOURCE_LANG, loadTranslator, readLang, selectLanguage, subscribeLang } from '@/lib/translate';

/*
 * The active pill is styled from <html lang>, which the pre-paint script in layout.tsx sets from
 * the cookie. It is right on the very first frame, before hydration, instead of rendering the
 * server's language and switching after.
 */
const ACTIVE_PILL_CSS = `${LANGUAGES.map(
  (l) => `html[lang="${l.code}"] [data-lang-option="${l.code}"]`
).join(',')}{background-color:var(--color-primary);color:#fff}`;

/**
 * The cookie is an external store: it changes outside React and emits no event.
 * `useSyncExternalStore` renders the server snapshot during hydration and swaps to the real value
 * after — no mismatch, and no setState-in-an-effect. Only aria-pressed reads it.
 */
const serverLang = () => SOURCE_LANG;

/**
 * Language switch for the navbar. Switches in the live document — never a reload — so scroll
 * position, open drawers and the cart all survive. See selectLanguage in lib/translate.ts.
 */
export default function LanguageToggle({ className = '' }: { className?: string }) {
  const lang = useSyncExternalStore(subscribeLang, readLang, serverLang);

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-full border border-divider bg-white/70 p-0.5 ${className}`}
      role="group"
      aria-label="Select language"
      data-translate-toggle=""
      // Keeps Google from translating the switch's own labels.
      translate="no"
      // The translator loads lazily; start it as soon as someone reaches for the switch.
      onPointerEnter={loadTranslator}
      onFocus={loadTranslator}
    >
      <style href="language-toggle-active-pill" precedence="default">
        {ACTIVE_PILL_CSS}
      </style>
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => selectLanguage(l.code)}
          aria-pressed={lang === l.code}
          aria-label={`Switch to ${l.name}`}
          lang={l.code}
          data-lang-option={l.code}
          suppressHydrationWarning
          className="min-w-[34px] rounded-full px-2.5 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-primary/70 transition-colors duration-200 hover:text-primary"
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
