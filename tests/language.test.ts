import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LANGUAGES,
  SOURCE_LANG,
  TRANSLATOR_SRC,
  applyDocumentLanguage,
  bootLanguageScript,
  readLang,
  selectLanguage,
  type Lang,
} from '../lib/translate';
import { cartView } from '../lib/cart-limits';

/*
 * Just enough browser for the language switch: a cookie jar, <html>, <body>, and Google's
 * <select>. `reloads` counts window.location.reload calls — a reload would throw away the cart.
 */
const g = globalThis as unknown as Record<string, unknown>;
const def = (code: string) => LANGUAGES.find((l) => l.code === code)!;

function browser({ cookie = '', shown = SOURCE_LANG as Lang, widget = true } = {}) {
  const jar = new Map<string, string>();
  const write = (pair: string) => {
    const i = pair.indexOf('=');
    jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  };
  cookie.split(';').filter((c) => c.includes('=')).forEach(write);

  // Google marks a translated page by the target's script direction: Arabic → translated-rtl.
  const html = { lang: 'en', dir: '', className: shown === SOURCE_LANG ? '' : 'translated-rtl' };
  const appended: { src?: string }[] = [];
  const select = widget
    ? {
        value: shown === SOURCE_LANG ? '' : shown,
        options: LANGUAGES.map((l) => ({ value: l.code })),
        changes: 0,
        dispatchEvent(e: Event) {
          if (e.type === 'change') this.changes++;
          return true;
        },
      }
    : null;
  // Google's "Show original" button, inside its hidden banner iframe: it puts the page back.
  let restores = 0;
  const banner = {
    contentDocument: {
      querySelector: () => ({
        click() {
          restores++;
          html.className = '';
        },
      }),
    },
  };
  let reloads = 0;

  const doc = {
    get cookie() {
      return [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    },
    set cookie(value: string) {
      write(value.split(';')[0]);
    },
    documentElement: html,
    body: { appendChild: (node: { src?: string }) => (appended.push(node), node) },
    querySelector: (selector: string) =>
      selector === 'select.goog-te-combo'
        ? select
        : selector.startsWith('script[src=')
          ? appended.find((n) => n.src) ?? null
          : null,
    querySelectorAll: (selector: string) => (selector === 'iframe.skiptranslate' && widget ? [banner] : []),
    getElementById: () => null,
    createElement: () => ({ src: '', async: false, setAttribute() {}, appendChild() {} }),
  };
  g.document = doc;
  g.window = { location: { hostname: 'localhost', reload: () => void reloads++ } };
  g.MutationObserver = class { observe() {} disconnect() {} };
  return { doc, html, select, appended, reloads: () => reloads, restores: () => restores };
}

/** The switch waits for Google's select to offer the language; let those promises settle. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

/** A fresh page load: the pre-paint script from the layout, run against a new document. */
function freshPageLoad(cookie: string) {
  const html = { lang: 'en', dir: '', className: '' };
  new Function('document', bootLanguageScript)({ cookie, documentElement: html });
  return html;
}

test('English → Arabic: selected, persisted and applied to <html> at once, in place', async () => {
  const b = browser();
  selectLanguage('ar');
  assert.equal(readLang(), 'ar');
  assert.match(b.doc.cookie, /googtrans=\/en\/ar/);
  assert.deepEqual([b.html.lang, b.html.dir], ['ar', 'ltr']);
  await flush();
  assert.equal(b.select!.value, 'ar');
  assert.equal(b.select!.changes, 1, 'Google is told through its own select');
  assert.equal(b.reloads(), 0);
});

test('the layout never mirrors: every language keeps the page left-to-right', () => {
  // Switching only translates text; nothing moves, the language toggle included.
  for (const l of LANGUAGES) assert.equal(l.dir, 'ltr', `${l.code} must not flip the page`);
});

test("Arabic → English: Google's Show original, not a translation INTO English", () => {
  const b = browser({ cookie: 'googtrans=/en/ar', shown: 'ar' });
  selectLanguage('en');
  assert.equal(readLang(), 'en');
  assert.doesNotMatch(b.doc.cookie, /googtrans=\/en\//, 'the cookie is removed, never /en/en');
  assert.deepEqual([b.html.lang, b.html.dir], ['en', 'ltr']);
  assert.equal(b.restores(), 1);
  assert.equal(b.select!.changes, 0, 'selecting English in Google would translate en→en');
  assert.equal(b.html.className, '');
  assert.equal(b.reloads(), 0);
});

test('Arabic → English → Arabic: the second switch to Arabic translates again', async () => {
  const b = browser();
  selectLanguage('ar');
  await flush();
  b.html.className = 'translated-rtl'; // Google's pass landed
  selectLanguage('en');
  selectLanguage('ar');
  await flush();
  assert.equal(b.select!.value, 'ar');
  assert.equal(b.select!.changes, 2);
  assert.equal(b.reloads(), 0);
});

test('a page Google left translated INTO English is restored before translating to Arabic', async () => {
  // An old googtrans=/en/en cookie makes Google start in that state; from it, selecting Arabic
  // in Google's select only restores the original. Restoring first makes the switch translate.
  const b = browser({ cookie: 'googtrans=/en/en' });
  b.html.className = 'translated-ltr';
  b.select!.value = 'en';
  selectLanguage('ar');
  await flush();
  assert.equal(b.restores(), 1);
  assert.equal(b.select!.value, 'ar');
  assert.equal(b.select!.changes, 1);
});

test('switching before Google has loaded starts it instead of reloading the page', () => {
  const b = browser({ widget: false });
  selectLanguage('ar');
  assert.equal(readLang(), 'ar', 'the cookie Google reads on start-up is already written');
  assert.deepEqual([b.html.lang, b.html.dir], ['ar', 'ltr']);
  assert.ok(b.appended.some((n) => n.src === TRANSLATOR_SRC), "Google's script is injected");
  assert.equal(b.reloads(), 0);
});

test('every supported language can be selected, with its own lang and dir', () => {
  for (const target of LANGUAGES) {
    const from = LANGUAGES.find((l) => l.code !== target.code)!;
    const b = browser({ cookie: `googtrans=/en/${from.code}`, shown: from.code });
    selectLanguage(target.code);
    assert.equal(readLang(), target.code);
    assert.deepEqual([b.html.lang, b.html.dir], [target.code, target.dir]);
    assert.equal(b.reloads(), 0);
  }
});

test('re-selecting the language already shown does nothing; a stale cookie never makes the button dead', async () => {
  const settled = browser({ cookie: 'googtrans=/en/ar', shown: 'ar' });
  selectLanguage('ar');
  await flush();
  assert.equal(settled.select!.changes, 0);

  // Cookie says Arabic, but a failed pass left the page in English: the click must still work.
  const stale = browser({ cookie: 'googtrans=/en/ar', shown: 'en' });
  selectLanguage('ar');
  await flush();
  assert.equal(stale.select!.changes, 1);
});

test('startup restores the persisted language before first paint', () => {
  assert.deepEqual(Object.values(freshPageLoad('googtrans=/en/ar')).slice(0, 2), ['ar', 'ltr']);
  assert.deepEqual(Object.values(freshPageLoad('googtrans=%2Fen%2Far')).slice(0, 2), ['ar', 'ltr']);
  assert.deepEqual(Object.values(freshPageLoad('googtrans=/en/en')).slice(0, 2), ['en', 'ltr']);
  assert.deepEqual(Object.values(freshPageLoad('')).slice(0, 2), ['en', 'ltr']);
  // A language the switch does not offer (an old Google cookie) falls back to the source.
  assert.deepEqual(Object.values(freshPageLoad('googtrans=/en/fr')).slice(0, 2), ['en', 'ltr']);
});

test('refresh: the language chosen before the reload is the one the new page starts in', () => {
  for (const lang of ['ar', 'en'] as const) {
    const before = browser({ cookie: lang === 'ar' ? '' : 'googtrans=/en/ar', shown: lang === 'ar' ? 'en' : 'ar' });
    selectLanguage(lang);
    const after = freshPageLoad(before.doc.cookie);
    assert.deepEqual([after.lang, after.dir], [lang, def(lang).dir]);
  }
});

test('navigation keeps the selected language on <html>', () => {
  const b = browser();
  selectLanguage('ar');
  // Several client navigations later — whatever a page rendered, the sync puts it back.
  for (let i = 0; i < 3; i++) {
    b.html.lang = 'en';
    b.html.dir = '';
    applyDocumentLanguage(readLang());
    assert.deepEqual([b.html.lang, b.html.dir], ['ar', 'ltr']);
  }
  assert.equal(readLang(), 'ar', 'navigating never touches the persisted choice');
});

test('a language change cannot reset the cart', () => {
  // The cart lives in the page (AppContext); only a reload or a language-keyed provider could
  // discard it. The switch never reloads (asserted above for every path) and the cart provider
  // does not depend on the language at all.
  const appContext = readFileSync(new URL('../context/AppContext.tsx', import.meta.url), 'utf8');
  assert.ok(!/lib\/translate|readLang|googtrans/.test(appContext));
  const b = browser();
  selectLanguage('ar');
  selectLanguage('en');
  assert.equal(b.reloads(), 0);
});

test('a cart that is still loading is never shown as empty', () => {
  assert.equal(cartView(0, true), 'loading');
  assert.equal(cartView(0, false), 'empty');
  assert.equal(cartView(2, true), 'items', 'items already known are shown even while a reload is in flight');
  assert.equal(cartView(2, false), 'items');
});
