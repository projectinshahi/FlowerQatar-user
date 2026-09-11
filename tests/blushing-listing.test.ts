import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateListing } from '../lib/shop-facets';

/**
 * The Blushing Blooms listing draws one page as: six products, the video feature, six products.
 * These are the numbers the page passes.
 */
const PER_PAGE = 12;
const SPLIT = 6;
const list = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
const paginate = (n: number, page: number) => paginateListing(list(n), page, PER_PAGE, SPLIT);

test('a full page is six products, the video, then six more', () => {
  const p = paginate(12, 1);
  assert.deepEqual(p.before, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(p.after, [7, 8, 9, 10, 11, 12]);
  assert.equal(p.totalPages, 1);
});

test('a short catalogue fills the first run and leaves the second empty', () => {
  const p = paginate(2, 1);
  assert.deepEqual(p.before, [1, 2]);
  assert.deepEqual(p.after, []);
  assert.equal(p.totalPages, 1, 'two products is one page, so no pagination is offered');
});

test('six products fill the run before the video and nothing follows it', () => {
  const p = paginate(6, 1);
  assert.deepEqual(p.before, [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(p.after, []);
});

test('the 13th product opens a second page rather than disappearing', () => {
  // The regression this file exists for: a fixed slice(6, 12) dropped everything past twelve.
  const p1 = paginate(13, 1);
  const p2 = paginate(13, 2);
  assert.equal(p1.totalPages, 2);
  assert.deepEqual(p2.before, [13]);
  assert.deepEqual(p2.after, []);
});

test('every product is reachable across pages, exactly once', () => {
  const n = 25;
  const { totalPages } = paginate(n, 1);
  const seen: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    const p = paginate(n, i);
    seen.push(...p.before, ...p.after);
  }
  assert.equal(totalPages, 3);
  assert.deepEqual(seen, list(n), 'no product dropped, duplicated or reordered');
});

test('an out-of-range page clamps instead of rendering an empty grid', () => {
  // What happens when a filter narrows 25 products to 5 while the reader is on page 3.
  assert.equal(paginate(5, 3).page, 1);
  assert.deepEqual(paginate(5, 3).before, [1, 2, 3, 4, 5]);
  assert.equal(paginate(25, 99).page, 3);
  assert.equal(paginate(25, 0).page, 1);
  assert.equal(paginate(25, -4).page, 1);
});

test('an empty result set is one page with nothing on it', () => {
  const p = paginate(0, 1);
  assert.equal(p.totalPages, 1);
  assert.deepEqual(p.before, []);
  assert.deepEqual(p.after, []);
});
