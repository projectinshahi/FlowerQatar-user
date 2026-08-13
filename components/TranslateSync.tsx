'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  applyAttrs,
  applyLanguage,
  beginTransition,
  collectAttrs,
  endTransition,
  isTranslated,
  isTranslatorNoise,
  readLang,
  whenTranslated,
} from '@/lib/translate';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: { InlineLayout?: Record<string, number> };
      };
    };
  }
}

/**
 * Google's element.js defines `window.google.translate` well before the TranslateElement
 * constructor exists — it injects further scripts to finish setting itself up. Checking only
 * `google.translate` therefore passes far too early, and calling init then throws on
 * `InlineLayout`. Probe the exact path the init callback dereferences.
 */
function widgetReady(): boolean {
  return Boolean(
    window.googleTranslateElementInit &&
      window.google?.translate?.TranslateElement?.InlineLayout &&
      document.getElementById('google_translate_element')
  );
}

/**
 * One re-translation pass over whatever is currently in the DOM.
 *
 * Prefers driving the widget's own <select>, which is the only mechanism that actually
 * re-applies the language. Re-constructing TranslateElement does NOT re-read the cookie, so it
 * is used purely as a bootstrap for the case where the select does not exist yet.
 */
export function runPass(onSettled?: () => void): boolean {
  if (applyLanguage(readLang())) {
    whenTranslated(1500).then(() => onSettled?.());
    return true;
  }

  if (!widgetReady()) return false;
  const container = document.getElementById('google_translate_element')!;
  collectAttrs();
  // Clearing first prevents stacking a new widget instance on every pass.
  container.innerHTML = '';
  window.googleTranslateElementInit!();

  whenTranslated(1500).then(() => {
    applyAttrs();
    onSettled?.();
  });
  return true;
}

/**
 * Keeps the app translated, and owns the fade that hides the untranslated frame.
 *
 * Google's widget scans the document once, at script init. Anything that appears afterwards is
 * never seen and stays English — which covers a lot in this app: streamed Suspense sections
 * (the banner and its promotion bar), the cart/account/search drawers, modals, and any
 * component that re-keys itself, like the rotating PromotionBar. Re-initialising makes Google
 * re-read `googtrans` and re-translate the current DOM, exactly as a page load does.
 *
 * The masking attribute is set pre-paint by the inline script in layout.tsx; this component
 * clears it once a pass has actually landed.
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

    whenTranslated().then(() => {
      if (cancelled) return;
      applyAttrs();
      endTransition();
      // Native pass never landed (script blocked, or it raced us). Try once more explicitly;
      // if that also fails the page simply stays English, which is the safe outcome.
      if (!isTranslated()) runPass(() => !cancelled && applyAttrs());
    });

    return () => {
      cancelled = true;
      endTransition();
    };
  }, []);

  // Navigation: re-scan the new route's DOM, dimming rather than blanking.
  useEffect(() => {
    if (readLang() !== 'ar') return;

    let cancelled = false;
    // One frame so the incoming route has painted — otherwise the re-scan sees a partial DOM.
    const id = window.setTimeout(() => {
      if (cancelled) return;
      beginTransition('nav');
      if (!runPass(() => !cancelled && endTransition())) endTransition();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(id);
      endTransition();
    };
    // Intentionally keyed on the URL only — this must run once per navigation.
  }, [pathname, searchParams]);

  /*
   * Late-arriving content: streamed sections, drawers, modals, and components that replace
   * their own nodes on a timer. No fade here — this fires during normal browsing, and dimming
   * the page every time a carousel ticks would be worse than the untranslated flicker.
   */
  useEffect(() => {
    if (readLang() !== 'ar') return;

    let debounce = 0;
    let cooldownUntil = 0;
    let paused = false;

    const observer = new MutationObserver((records) => {
      if (paused) return;
      if (records.every(isTranslatorNoise)) return;

      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        // A cooldown bounds how often a full re-init can run, so a chatty animation can't
        // pin the main thread. Anything missed is picked up by the next burst.
        const now = Date.now();
        if (now < cooldownUntil) return;
        cooldownUntil = now + 1200;

        paused = true;
        observer.disconnect();
        runPass();
        // Let the pass settle before listening again, so its own edits aren't re-triggering.
        window.setTimeout(() => {
          paused = false;
          observer.observe(document.body, { childList: true, subtree: true });
        }, 700);
      }, 400);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.clearTimeout(debounce);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = readLang();
  }, [pathname, searchParams]);

  return null;
}
