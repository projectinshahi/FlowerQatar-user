import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.tsx') ? [p] : [];
  });
const admin = () =>
  [...files(join(root, 'components', 'admin')), ...files(join(root, 'app', 'admin'))].map((file) => ({
    name: file.slice(root.length),
    src: readFileSync(file, 'utf8'),
  }));

/*
 * Admin controls revealed only on hover are invisible on touch screens: Tailwind v4 puts every
 * hover variant inside @media (hover: hover), so on an iPad or phone `group-hover:opacity-100`
 * never applies and the Edit/Delete buttons stay at opacity 0 — even when tapped.
 */
test('admin controls hidden until hover are always shown on touch screens', () => {
  const offenders: string[] = [];
  for (const { name, src } of admin()) {
    for (const cls of src.match(/className="[^"]*"/g) ?? []) {
      if (/\bopacity-0\b/.test(cls) && cls.includes('group-hover:opacity-100') && !cls.includes('any-pointer-coarse:opacity-100')) {
        offenders.push(`${name}: ${cls}`);
      }
    }
  }
  assert.deepEqual(offenders, []);
});

/*
 * On a narrow or zoomed screen an admin table is wider than its card. Inside `overflow-hidden`
 * its last column — the row actions — is cut off with no way to scroll to it (Gift Groups on an
 * iPad); inside `overflow-x-auto` it scrolls, and `sticky-actions` keeps that column in view.
 */
test('admin tables scroll sideways and keep their Actions column in view', () => {
  const offenders: string[] = [];
  for (const { name, src } of admin()) {
    for (const m of src.matchAll(/<table className="([^"]*)"/g)) {
      const wrapper = src.slice(0, m.index).match(/overflow-(?:x-)?(?:auto|hidden|scroll)\b/g)?.pop();
      if (wrapper !== 'overflow-x-auto') offenders.push(`${name}: table inside ${wrapper ?? 'no scroll container'}`);
      const head = src.slice(m.index, src.indexOf('</thead>', m.index));
      if (/>\s*Actions\s*</.test(head) && !m[1].split(' ').includes('sticky-actions')) offenders.push(`${name}: Actions column not pinned`);
    }
  }
  assert.deepEqual(offenders, []);
  assert.ok(readFileSync(join(root, 'app', 'globals.css'), 'utf8').includes('.sticky-actions :is(th, td):last-child'));
});
