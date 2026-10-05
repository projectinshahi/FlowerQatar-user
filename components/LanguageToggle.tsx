'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  applyLanguage,
  beginTransition,
  endTransition,
  isTranslated,
  notifyLang,
  readLang,
  subscribeLang,
  writeLang,
  type Lang,
} from '@/lib/translate';
import { loadTranslator } from './GoogleTranslate';

const LANGS: { code: Lang; label: string; full: string }[] = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'ar', label: 'AR', full: 'العربية' },
];

/**
 * The cookie is an external store: it changes outside React and emits no event.
 * `useSyncExternalStore` renders the server snapshot ('en') during hydration and swaps to the
 * real value after — no mismatch, and no setState-in-an-effect.
 */
const serverLang = (): Lang => 'en';

/**
 * English / Arabic switch for the navbar.
 *
 * Switches in the live document — no reload — by driving the <select> Google injects, which
 * is the same path its own dropdown uses. Scroll position, open drawers and cart state all
 * survive. A reload is only used as a fallback, when the widget script hasn't produced that
 * select yet (cold load, slow network, blocked by an extension).
 */
export default function LanguageToggle({ className = '' }: { className?: string }) {
  const lang = useSyncExternalStore(subscribeLang, readLang, serverLang);

  const select = useCallback((next: Lang) => {
    // Deliberately NOT `if (next === readLang()) return`. The cookie can say Arabic while the
    // page is still English — any failed pass leaves exactly that state — and skipping on the
    // cookie alone then makes the Arabic button permanently dead. Re-applying is cheap, so
    // only skip when the cookie AND the rendered page already agree.
    if (next === readLang() && (next === 'en' ? !isTranslated() : isTranslated())) return;

    writeLang(next);
    notifyLang();

    // Dim rather than blank: the document survives, so there is no white frame to hide.
    beginTransition('nav');
    if (applyLanguage(next)) {
      window.setTimeout(endTransition, 600);
      return;
    }

    // No widget yet — fall back to a masked reload, which the cookie alone is enough to drive.
    beginTransition('boot');
    window.setTimeout(() => window.location.reload(), 200);
  }, []);

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
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => select(l.code)}
            aria-pressed={active}
            aria-label={`Switch to ${l.full}`}
            lang={l.code}
            suppressHydrationWarning
            className={`min-w-[34px] rounded-full px-2.5 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ${
              active ? 'bg-primary text-white' : 'text-primary/70 hover:text-primary'
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
