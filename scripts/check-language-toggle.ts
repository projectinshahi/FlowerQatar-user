/**
 * Self-check for googtrans cookie parsing — the only real logic behind the EN/AR switch.
 * Run with:  npx tsx scripts/check-language-toggle.ts
 *
 * Exercises the real `readLang` from lib/translate.ts by faking `document.cookie`, and asserts
 * the inline boot script in layout.tsx uses an equivalent pattern (it is a hand-inlined copy,
 * so the two can drift silently).
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

// The boot script is a hand-inlined copy of the same read. If it stops matching, Arabic
// visitors get an unmasked flash of English — so fail loudly rather than let it drift.
const layout = readFileSync(new URL('../app/(client)/layout.tsx', import.meta.url), 'utf8');
assert.ok(
  layout.includes(String.raw`/(?:^|;\\s*)googtrans=([^;]+)/`),
  'inline boot script cookie regex no longer matches lib/translate.ts'
);
assert.ok(layout.includes(`endsWith('/ar')`), 'inline boot script no longer checks the /ar suffix');
assert.ok(
  layout.includes(`setAttribute('data-translating','boot')`),
  'inline boot script no longer masks the page'
);
assert.ok(
  layout.includes(`removeAttribute('data-translating')`),
  'inline boot script lost its timeout fallback — the page could stay hidden'
);

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
 * reaching it in that window used to throw "Cannot read properties of undefined
 * (reading 'InlineLayout')".
 */
const widget = readFileSync(new URL('../components/GoogleTranslate.tsx', import.meta.url), 'utf8');
assert.ok(
  widget.includes('if (!T || !T.InlineLayout) return false;'),
  'init callback lost its guard — a premature call will throw on InlineLayout again'
);
assert.ok(
  widget.includes("includedLanguages: 'en,ar'"),
  'widget must stay limited to English and Arabic'
);

const sync = readFileSync(new URL('../components/TranslateSync.tsx', import.meta.url), 'utf8');
assert.ok(
  sync.includes('TranslateElement?.InlineLayout'),
  'readiness probe must dereference the same path the init callback uses'
);

console.log('cookie parsing + boot guard + loop guard + attribute filter + widget guard OK');
