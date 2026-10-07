/**
 * The storefront's language switch.
 *
 * Pages are rendered in SOURCE_LANG; every other language is Google's website translator
 * rewriting the page in the browser. ONE value says which language is selected: the `googtrans`
 * cookie. Google reads it when its widget starts, the startup script reads it before first paint,
 * and the toggle reads and writes it — nothing else stores a language, so nothing can disagree.
 */

/**
 * Every language the switch offers. The toggle, Google's config, `lang` and `dir` all follow it.
 *
 * Arabic is deliberately `ltr`: switching translates the text but keeps the layout exactly where
 * it is — nothing mirrors or moves (the toggle included). Arabic sentences still read right to
 * left inside their own boxes; the browser's bidi handling does that without a page-level `dir`.
 */
export const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English', dir: 'ltr' },
  { code: 'ar', label: 'AR', name: 'العربية', dir: 'ltr' },
] as const;

export type Lang = (typeof LANGUAGES)[number]['code'];

/** The language the server renders, and the one Google translates from. */
export const SOURCE_LANG: Lang = 'en';

/**
 * The selected language, from a cookie string: Google stores it as `/<source>/<target>`. An
 * unknown or missing target means the source language.
 *
 * Self-contained on purpose — it is stringified into `bootLanguageScript`, so the pre-paint
 * script and the running app use this one parser and cannot drift apart.
 */
export function resolveLang<L extends { readonly code: string; readonly dir: string }>(
  cookie: string,
  langs: readonly L[],
  source: string
): L {
  // Anchored so `mygoogtrans` / `googtrans_backup` can't match.
  const match = cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  let target = '';
  try {
    target = decodeURIComponent(match ? match[1] : '').split('/').pop() || '';
  } catch {
    target = '';
  }
  return langs.find((l) => l.code === target) || langs.find((l) => l.code === source) || langs[0];
}

export function readLang(): Lang {
  if (typeof document === 'undefined') return SOURCE_LANG;
  return resolveLang(document.cookie, LANGUAGES, SOURCE_LANG).code;
}

/**
 * Inline in app/(client)/layout.tsx, ahead of the page: <html> carries the selected language's
 * `lang` and `dir` from the very first frame, instead of switching after hydration.
 */
export const bootLanguageScript = `(function(){try{var l=(${resolveLang.toString()})(document.cookie,${JSON.stringify(
  LANGUAGES
)},${JSON.stringify(SOURCE_LANG)});var h=document.documentElement;h.lang=l.code;h.dir=l.dir;}catch(e){}})();`;

/** Sets <html lang> and `dir` for a language — on a switch, and again on every navigation. */
export function applyDocumentLanguage(lang: Lang) {
  const def = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
  document.documentElement.lang = def.code;
  document.documentElement.dir = def.dir;
}

/*
 * The cookie is an external store with no change event, so the toggle subscribes explicitly to
 * re-render its pressed state after a switch.
 */
const listeners = new Set<() => void>();

export const subscribeLang = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};

const notifyLang = () => listeners.forEach((cb) => cb());

function writeLang(lang: Lang) {
  // The source language is the absence of a translation, so its cookie is removed rather than
  // set to /en/en. Google reads /en/en as "translate into English", and from that state its
  // next switch to another language only restores the original instead of translating.
  const cookie =
    lang === SOURCE_LANG
      ? 'googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT'
      : `googtrans=/${SOURCE_LANG}/${lang};path=/`;
  const { hostname } = window.location;
  // Written on both the bare host and the dot-domain: Google reads the dot-domain form in
  // production, but that variant is rejected on localhost, so set both and let one stick.
  document.cookie = cookie;
  if (hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    document.cookie = `${cookie};domain=.${hostname.replace(/^www\./, '')}`;
  }
}

/** Google stamps this on <html> once a pass has actually been applied. */
export const isTranslated = () => document.documentElement.className.includes('translated-');

/** Resolves when <html>'s class satisfies `test` — Google's own signal, so no timer is involved. */
function whenHtmlClass(test: () => boolean): Promise<void> {
  if (test()) return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (!test()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  });
}

/** Resolves when Google has applied a translation pass. */
export const whenTranslated = () => whenHtmlClass(isTranslated);

/**
 * True when a mutation was produced by the translator itself rather than by the app.
 *
 * Google rewrites translated text into <font> wrappers and churns its own widget container.
 * Without this filter, every translation pass would look like new content and schedule another
 * pass — an endless loop that pins the main thread. Treat changes to it with care.
 */
// Node.ELEMENT_NODE / Node.TEXT_NODE as literals: the `Node` global does not exist outside a
// browser, and keeping these local lets scripts/check-language-toggle.ts import this file.
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

export function isTranslatorNoise(record: MutationRecord): boolean {
  const target = record.target as HTMLElement | null;
  if (
    target?.nodeType === ELEMENT_NODE &&
    target.closest?.(
      `#google_translate_element, #${ATTR_POOL_ID}, .skiptranslate, .goog-te-spinner-pos`
    )
  ) {
    return true;
  }

  const touched = [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)];
  if (touched.length === 0) return false;
  // A pass swaps text nodes for <font> wrappers and back; nothing else is app content.
  return touched.every((n) => n.nodeName === 'FONT' || n.nodeType === TEXT_NODE);
}

/* ── Attribute translation ─────────────────────────────────────────────────────────────
 *
 * Google's widget only walks text nodes, so text that lives in an attribute — every search
 * placeholder, aria-label, image alt and tooltip — stays English no matter how many passes
 * run. There is no API to hand it a string directly.
 *
 * The workaround is to make that text look like page content: each attribute's value is
 * mirrored into a hidden <span> in a pool the translator can see, and once the pass lands the
 * translated span text is copied back onto the attribute. No hand-written dictionary, and the
 * Arabic comes from the same engine as the rest of the page.
 */

export const ATTR_POOL_ID = 'google_translate_attr_pool';
const TRANSLATABLE_ATTRS = ['placeholder', 'aria-label', 'title', 'alt'] as const;
const KEY_ATTR = 'data-gt-key';

/**
 * Only prose is worth sending through the translator. Values made purely of digits and
 * punctuation are format hints — a card number mask, a hex colour, a quantity — and running
 * them through translation would corrupt the hint for no benefit.
 */
export const isTranslatableValue = (value: string) => {
  const text = value.trim();
  if (text.length === 0) return false;
  // Hex colours need their own test: #61000B contains letters, so the punctuation-and-digits
  // rule below reads it as prose and would happily translate a colour placeholder.
  if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(text)) return false;
  return !/^[#\d\W_]+$/.test(text);
};

let nextKey = 0;

function pool(): HTMLElement {
  let el = document.getElementById(ATTR_POOL_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = ATTR_POOL_ID;
    // Visually hidden but still translated — `display:none` subtrees get skipped.
    el.setAttribute(
      'style',
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap'
    );
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Mirrors every untranslated attribute value into the hidden pool. Call BEFORE a pass.
 * Elements already registered are skipped, so repeated passes don't grow the pool.
 */
export function collectAttrs() {
  const container = pool();
  const selector = TRANSLATABLE_ATTRS.map((a) => `[${a}]`).join(',');

  document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    if (el.closest(`#${ATTR_POOL_ID}, #google_translate_element, .skiptranslate`)) return;
    if (el.getAttribute('translate') === 'no' || el.closest('[translate="no"]')) return;

    for (const attr of TRANSLATABLE_ATTRS) {
      const value = el.getAttribute(attr);
      if (!value || !isTranslatableValue(value)) continue;

      const registry = (el.dataset.gtAttrs ?? '').split('|').filter(Boolean);
      if (registry.some((entry) => entry.startsWith(`${attr}:`))) continue;

      const key = `k${nextKey++}`;
      // Remember the ORIGINAL text: once the attribute holds Arabic, the English is gone and
      // switching back would have nothing to restore.
      el.dataset[`gtOrig${key}`] = value;
      registry.push(`${attr}:${key}`);
      el.dataset.gtAttrs = registry.join('|');

      const span = document.createElement('span');
      span.setAttribute(KEY_ATTR, key);
      span.textContent = value;
      container.appendChild(span);
    }
  });
}

/** Copies translated pool text back onto the attributes. Call AFTER a pass lands. */
export function applyAttrs() {
  const container = document.getElementById(ATTR_POOL_ID);
  if (!container) return;

  const translated = new Map<string, string>();
  container.querySelectorAll<HTMLElement>(`[${KEY_ATTR}]`).forEach((span) => {
    const key = span.getAttribute(KEY_ATTR);
    const text = span.textContent?.trim();
    if (key && text) translated.set(key, text);
  });

  document.querySelectorAll<HTMLElement>('[data-gt-attrs]').forEach((el) => {
    for (const entry of (el.dataset.gtAttrs ?? '').split('|').filter(Boolean)) {
      const [attr, key] = entry.split(':');
      const value = translated.get(key);
      if (value && value !== el.getAttribute(attr)) el.setAttribute(attr, value);
    }
  });
}

/** Puts the original English back into every attribute we overwrote. */
export function restoreAttrs() {
  document.querySelectorAll<HTMLElement>('[data-gt-attrs]').forEach((el) => {
    for (const entry of (el.dataset.gtAttrs ?? '').split('|').filter(Boolean)) {
      const [attr, key] = entry.split(':');
      const original = el.dataset[`gtOrig${key}`];
      if (original) el.setAttribute(attr, original);
    }
  });
}

/* ── Google's widget ─────────────────────────────────────────────────────────────────── */

export const TRANSLATOR_SRC =
  'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

/**
 * Injects Google's translator once; later calls do nothing. When it starts it applies the
 * `googtrans` cookie by itself, which is why a switch made before it has loaded needs no more
 * than writing the cookie and starting it.
 */
export function loadTranslator() {
  if (document.querySelector(`script[src="${TRANSLATOR_SRC}"]`)) return;
  type TranslateElement = { new (options: object, elementId: string): unknown };
  const w = window as unknown as {
    googleTranslateElementInit: () => boolean;
    google?: { translate?: { TranslateElement?: TranslateElement } };
  };
  w.googleTranslateElementInit = function () {
    // element.js publishes window.google.translate before TranslateElement finishes
    // loading, so this callback can be reached while the constructor is still missing.
    // Bail instead of throwing — the caller retries.
    const T = w.google?.translate?.TranslateElement;
    if (!T) return false;
    // Google's default layout, NOT InlineLayout.SIMPLE: SIMPLE draws a link-style menu and never
    // creates the <select class="goog-te-combo"> that translateTo() drives, so a switch made
    // after the widget loaded never translated anything. The widget itself stays hidden.
    new T(
      {
        pageLanguage: SOURCE_LANG,
        includedLanguages: LANGUAGES.map((l) => l.code).join(','),
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

/** Google's own <select>. Driving it is the same code path as a click on Google's dropdown. */
const widgetSelect = () => document.querySelector<HTMLSelectElement>('select.goog-te-combo');

/**
 * Resolves with Google's select once it offers `lang`. The element appears before its options
 * (they load from Google separately), and setting a value it does not offer yet does nothing.
 */
function whenWidgetOffers(lang: Lang): Promise<HTMLSelectElement> {
  const ready = () => {
    const select = widgetSelect();
    return select && Array.from(select.options).some((o) => o.value === lang) ? select : null;
  };
  const existing = ready();
  if (existing) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const select = ready();
      if (!select) return;
      observer.disconnect();
      resolve(select);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

/** The language the page is showing right now; null when that can't be told. */
function shownLang(): Lang | null {
  if (!isTranslated()) return SOURCE_LANG;
  const value = widgetSelect()?.value;
  return LANGUAGES.find((l) => l.code === value)?.code ?? null;
}

/**
 * Back to the page exactly as rendered, through Google's own "Show original" (it lives in the
 * hidden banner iframe). Selecting the source language in Google's select instead would ask for
 * a translation INTO English — see writeLang for why that state must be avoided.
 */
function showOriginal() {
  restoreAttrs();
  if (!isTranslated()) return;
  const restore = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe.skiptranslate'))
    .map((frame) => {
      try {
        return frame.contentDocument?.querySelector<HTMLElement>('[id$=".restore"]') ?? null;
      } catch {
        return null; // a cross-origin frame is not Google's banner
      }
    })
    .find(Boolean);
  if (restore) {
    restore.click();
    return;
  }
  // No banner (Google changed its markup): the select is the only control left.
  const select = widgetSelect();
  if (select) {
    select.value = SOURCE_LANG;
    select.dispatchEvent(new Event('change'));
  }
}

/**
 * Translates the live document through Google's select. Setting it and firing `change` is the
 * one in-place mechanism that works: re-constructing TranslateElement does NOT re-read the
 * cookie.
 *
 * Google only translates from the original page. Asked to go from one translation straight to
 * another it merely restores the original — the "second click does nothing" bug — so a page that
 * is already translated is restored first.
 */
function translateTo(select: HTMLSelectElement, lang: Lang) {
  // Register attribute text before the pass so the hidden pool is translated with everything else.
  collectAttrs();
  const run = () => {
    select.value = lang;
    select.dispatchEvent(new Event('change'));
    // Only if this is still the chosen language when the pass lands (the visitor may have
    // switched back in the meantime).
    whenTranslated().then(() => readLang() === lang && applyAttrs());
  };
  if (!isTranslated()) {
    run();
    return;
  }
  showOriginal();
  whenHtmlClass(() => !isTranslated()).then(run);
}

/**
 * Switches the storefront's language in the live document. It never reloads: the cart, open
 * drawers and scroll position all live in the page and survive.
 *
 * The selection is persisted and applied to <html> at once; Google then translates the text.
 */
export function selectLanguage(next: Lang) {
  // Skip only when the cookie AND the page already agree. A failed pass can leave the cookie on
  // a translation over a page still in the source language; a cookie-only check would then make
  // that language's button permanently dead.
  if (next === readLang() && shownLang() === next) return;

  writeLang(next);
  applyDocumentLanguage(next);
  notifyLang();

  if (next === SOURCE_LANG) {
    showOriginal();
    return;
  }

  // Starts the widget if it isn't up yet (it then applies the cookie by itself); a no-op once it
  // is. Either way, translate as soon as Google's select offers the language, unless the visitor
  // has switched again by then or the start-up pass already shows it.
  loadTranslator();
  whenWidgetOffers(next).then((select) => {
    if (readLang() === next && shownLang() !== next) translateTo(select, next);
  });
}
