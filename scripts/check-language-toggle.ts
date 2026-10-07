/**
 * Self-check for the language switch. Run with:  npx tsx scripts/check-language-toggle.ts
 *
 * Exercises the real googtrans parsing from lib/translate.ts by faking `document.cookie`, and
 * asserts the structural invariants that keep the switch from regressing (no reload, no page
 * mask, no widget rebuild). Behaviour is covered by tests/language.test.ts.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isTranslatableValue, isTranslatorNoise, readLang } from '../lib/translate';

// `readLang` reads the ambient `document`; stub just enough of it.
const g = globalThis as unknown as { document?: { cookie: string } };
const read = (cookie: string): 'en' | 'ar' => {
  g.document = { cookie };
  return readLang();
};

assert.equal(read(''), 'en', 'no cookie → english');
assert.equal(read('googtrans=/en/ar'), 'ar');
assert.equal(read('googtrans=/en/en'), 'en');

// URL-encoded form is what browsers actually store.
assert.equal(read('googtrans=%2Fen%2Far'), 'ar', 'encoded value must decode');

// Must match the right cookie, not a prefix/suffix of a neighbour.
assert.equal(read('foo=1; googtrans=/en/ar; bar=2'), 'ar', 'cookie in the middle');
assert.equal(read('mygoogtrans=/en/ar'), 'en', 'must not match a differently-named cookie');
assert.equal(read('googtrans_backup=/en/ar'), 'en', 'must not match a longer cookie name');

// A stale third language (the widget is now limited to en,ar) must not read as Arabic.
assert.equal(read('googtrans=/en/fr'), 'en', 'unknown target falls back to english');

// The pre-paint script must be the shared one — a hand-inlined copy of the parser drifted before.
const layout = readFileSync(new URL('../app/(client)/layout.tsx', import.meta.url), 'utf8');
assert.ok(
  layout.includes('dangerouslySetInnerHTML={{ __html: bootLanguageScript }}'),
  'layout must run bootLanguageScript from lib/translate.ts before first paint'
);
assert.ok(!layout.includes('data-translating'), 'the page must never be masked while Google loads');

/*
 * Loop guard. If isTranslatorNoise ever returns false for the translator's own edits, the
 * MutationObserver in TranslateSync re-triggers itself forever and pins the browser. If it
 * returns true for real app content, late-arriving sections stay in English. Both directions
 * are asserted.
 */
const el = (name: string, matches = false) => ({
  nodeName: name.toUpperCase(),
  nodeType: 1,
  closest: () => (matches ? {} : null),
});
const text = () => ({ nodeName: '#text', nodeType: 3 });
const record = (over: Record<string, unknown>) =>
  ({ target: el('div'), addedNodes: [], removedNodes: [], ...over }) as unknown as MutationRecord;

// Translator noise → must be ignored.
assert.equal(
  isTranslatorNoise(record({ target: el('div', true) })),
  true,
  'edits inside the widget container must be ignored'
);
assert.equal(
  isTranslatorNoise(record({ addedNodes: [el('font')] })),
  true,
  '<font> wrappers are how Google marks translated text'
);
assert.equal(
  isTranslatorNoise(record({ addedNodes: [el('font')], removedNodes: [text()] })),
  true,
  'text swapped for a <font> wrapper is a translation pass'
);

// Real app content → must trigger a re-translate.
assert.equal(
  isTranslatorNoise(record({ addedNodes: [el('div')] })),
  false,
  'a newly streamed section must not be treated as noise'
);
assert.equal(
  isTranslatorNoise(record({ addedNodes: [el('font'), el('span')] })),
  false,
  'a mixed batch contains real content and must not be ignored'
);
assert.equal(
  isTranslatorNoise(record({})),
  false,
  'attribute-only records carry no nodes and must not be ignored'
);

/*
 * Attribute-value filter. Real placeholders from this codebase must go through the translator;
 * format hints must not, or a card-number mask or hex colour gets mangled into Arabic.
 */
for (const prose of [
  'Search products...',
  'Enter your email address',
  'PROMO CODE',
  '3 or 4 digits',
  'City',
  'Apartment, floor, landmark (optional)',
]) {
  assert.equal(isTranslatableValue(prose), true, `should translate: ${prose}`);
}

for (const hint of ['#000000', '#61000B', '0', '20', '0000 0000 0000 0000', '   ', '']) {
  assert.equal(isTranslatableValue(hint), false, `should NOT translate: ${JSON.stringify(hint)}`);
}

/*
 * The init callback is inline JS, so TypeScript can't protect it. It must stay defensive:
 * element.js publishes window.google.translate before TranslateElement exists, and a caller
 * reaching it in that window used to throw.
 *
 * And it must use Google's default layout: InlineLayout.SIMPLE draws a link-style menu and never
 * creates the select.goog-te-combo the switch drives, so AR silently stopped translating in place.
 */
const translateLib = readFileSync(new URL('../lib/translate.ts', import.meta.url), 'utf8');
const translateCode = translateLib.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
assert.ok(
  translateLib.includes('if (!T) return false;'),
  'init callback lost its guard — a premature call will throw again'
);
assert.ok(
  !translateCode.includes('InlineLayout'),
  'InlineLayout.SIMPLE never builds select.goog-te-combo — the switch would stop translating'
);
/*
 * Back to English is Google's "Show original", never a translation INTO English: from that state
 * Google's next switch only restores the page, so the second click on AR appeared to do nothing.
 */
assert.ok(translateLib.includes("'[id$=\".restore\"]'"), "EN must use Google's Show original");
assert.ok(
  translateLib.includes("includedLanguages: LANGUAGES.map((l) => l.code).join(',')"),
  'widget must offer exactly the languages the switch offers'
);

/*
 * TranslateSync must never rebuild the widget. Wiping #google_translate_element and calling the
 * init again does not re-read googtrans — it tears the widget down, and doing it on every DOM
 * change kept Arabic pages dropping back to English. Google translates late content by itself.
 */
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const syncCode = stripComments(
  readFileSync(new URL('../components/TranslateSync.tsx', import.meta.url), 'utf8')
);
assert.ok(!syncCode.includes('googleTranslateElementInit'), 'TranslateSync must not re-initialise the widget');
assert.ok(!/innerHTML\s*=/.test(syncCode), 'TranslateSync must not wipe the widget container');

/*
 * Rotating bars must keep every slide mounted. A slide re-keyed on a timer is a brand-new English
 * node each tick, replacing the translated one before Google can translate it again.
 */
for (const file of ['PromotionBar']) {
  const src = stripComments(readFileSync(new URL(`../components/${file}.tsx`, import.meta.url), 'utf8'));
  assert.ok(!/key=\{(safeIndex|currentIndex)\}/.test(src), `${file} must not re-key its slide on every tick`);
}

/*
 * The toggle must never skip purely on the cookie. A failed pass leaves googtrans=/en/ar on a
 * page that is still English; a cookie-only guard then makes the Arabic button permanently
 * dead, with no way for the user to recover short of clearing cookies.
 */
assert.ok(
  translateLib.includes('next === readLang() && shownLang() === next'),
  'switch must corroborate the cookie against the rendered page before skipping'
);
for (const file of ['../lib/translate.ts', '../components/LanguageToggle.tsx']) {
  const src = stripComments(readFileSync(new URL(file, import.meta.url), 'utf8'));
  assert.ok(!src.includes('location.reload'), `${file}: a language switch must never reload — it throws away the cart`);
}

/*
 * In-place switching. Setting `select.goog-te-combo` and firing `change` is the only mechanism
 * that actually re-applies the language — re-constructing TranslateElement does NOT re-read
 * the cookie, which is why an earlier version appeared to do nothing until a manual refresh.
 * If this ever regresses to init-only, the toggle silently stops working in the live document.
 */
assert.ok(
  translateLib.includes('select.goog-te-combo'),
  'translateTo must drive the widget select — init alone does not re-apply the language'
);
assert.ok(
  translateLib.includes("dispatchEvent(new Event('change'))"),
  'the select needs a change event; assigning .value alone does nothing'
);
assert.ok(
  translateLib.includes('export function restoreAttrs'),
  'switching back to English must restore the original attribute text'
);

console.log('cookie + pre-paint script + loop guard + attribute filter + widget guard + no-rebuild + no-reload + in-place OK');
