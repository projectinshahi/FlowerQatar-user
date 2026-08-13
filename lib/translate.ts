/**
 * Shared client helpers for the Google-backed EN/AR switch.
 *
 * Both the toggle and the sync component need to read the same cookie and drive the same
 * transition attribute, so the logic lives here rather than being duplicated in each.
 */

export type Lang = 'en' | 'ar';

/** Attribute set on <html> while a translation pass is in flight. Styled in globals.css. */
export const TRANSLATING_ATTR = 'data-translating';

/** Hard ceiling on the masked state, so a blocked or failed script can never hide the page. */
export const TRANSLATE_TIMEOUT_MS = 2500;

/**
 * Google stores the active translation in a `googtrans` cookie shaped `/<source>/<target>`.
 * The pattern is anchored so `mygoogtrans` / `googtrans_backup` can't match.
 */
export function readLang(): Lang {
  if (typeof document === 'undefined') return 'en';
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  return decodeURIComponent(match?.[1] ?? '').endsWith('/ar') ? 'ar' : 'en';
}

export function writeLang(lang: Lang) {
  const value = lang === 'en' ? '/en/en' : `/en/${lang}`;
  const { hostname } = window.location;
  // Written on both the bare host and the dot-domain: Google reads the dot-domain form in
  // production, but that variant is rejected on localhost, so set both and let one stick.
  document.cookie = `googtrans=${value};path=/`;
  if (hostname !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    document.cookie = `googtrans=${value};path=/;domain=.${hostname.replace(/^www\./, '')}`;
  }
}

/** Google stamps this on <html> once a pass has actually been applied. */
export const isTranslated = () =>
  document.documentElement.className.includes('translated-');

/**
 * Resolves when Google has applied a translation pass, or when the timeout expires — whichever
 * comes first. The timeout is what guarantees the page always becomes visible again.
 */
export function whenTranslated(timeout = TRANSLATE_TIMEOUT_MS): Promise<void> {
  if (isTranslated()) return Promise.resolve();

  return new Promise((resolve) => {
    const done = () => {
      observer.disconnect();
      window.clearTimeout(timer);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (isTranslated()) done();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const timer = window.setTimeout(done, timeout);
  });
}

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

/** 'boot' fully masks the page (first paint); 'nav' only dims it (route change). */
export function beginTransition(kind: 'boot' | 'nav') {
  document.documentElement.setAttribute(TRANSLATING_ATTR, kind);
}

export function endTransition() {
  document.documentElement.removeAttribute(TRANSLATING_ATTR);
}
