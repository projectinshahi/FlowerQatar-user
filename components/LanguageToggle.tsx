'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { beginTransition, endTransition, readLang, writeLang, type Lang } from '@/lib/translate';
import { runPass } from './TranslateSync';

const LANGS: { code: Lang; label: string; full: string }[] = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'ar', label: 'AR', full: 'العربية' },
];

/**
 * The cookie is an external store: it changes outside React and emits no event.
 * `useSyncExternalStore` renders the server snapshot ('en') during hydration and swaps to the
 * real value after — no mismatch, and no setState-in-an-effect. Nothing needs to subscribe,
 * because switching navigates away.
 */
const subscribe = () => () => {};
const serverLang = (): Lang => 'en';

/**
 * English / Arabic switch for the navbar.
 *
 * English → Arabic translates in place: dim, run a pass over the live DOM, fade back. No
 * reload, so scroll position, open drawers and cart state all survive.
 *
 * Arabic → English still reloads. Google has no reliable "undo" — its pass rewrites text nodes
 * into <font> wrappers and re-running it with an English target leaves stale Arabic behind.
 * Serving a fresh document is the only way to get every word back, and the fade masks it.
 */
export default function LanguageToggle({ className = '' }: { className?: string }) {
  const lang = useSyncExternalStore(subscribe, readLang, serverLang);

  const select = useCallback((next: Lang) => {
    if (next === readLang()) return;
    writeLang(next);

    if (next === 'en') {
      beginTransition('boot');
      // Let the fade-out paint before the document is torn down, so the switch reads as a
      // cross-fade instead of a white flash. Matches the 260ms transition in globals.css.
      window.setTimeout(() => window.location.reload(), 200);
      return;
    }

    beginTransition('nav');
    // Falls back to a reload if the widget script hasn't loaded (slow network, blocked).
    if (!runPass(endTransition)) window.location.reload();
  }, []);

  return (
    <div
      className={`inline-flex shrink-0 items-center rounded-full border border-divider bg-white/70 p-0.5 ${className}`}
      role="group"
      aria-label="Select language"
      data-translate-toggle=""
      // Keeps Google from translating the switch's own labels.
      translate="no"
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
