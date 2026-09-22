import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRefresh, type LiveEvent } from '../lib/live-events';

/** Which open pages re-render for which admin change. A wrong "false" leaves a page stale. */
const ev = (type: LiveEvent['type'], extra: Partial<LiveEvent> = {}): LiveEvent => ({ type, version: 1, ...extra });
const on = (event: LiveEvent, url: string) => {
  const u = new URL(url, 'http://x');
  return shouldRefresh(event, u.pathname, u.search);
};

test('product changes refresh listings and that product page only', () => {
  const edit = ev('product.updated', { ids: ['p1'], slugs: ['red-rose'] });
  for (const url of ['/', '/shop?category=flowers', '/search?q=rose', '/occasion/birthday']) {
    assert.equal(on(edit, url), true, url);
  }
  assert.equal(on(edit, '/product/red-rose'), true);
  assert.equal(on(edit, '/product/white-lily'), false, 'another product page is not refreshed');
  assert.equal(on(edit, '/about'), false);
});

test('a deleted product is not refreshed on its own page (it would become a 404)', () => {
  const del = ev('product.deleted', { ids: ['p1'], slugs: ['red-rose'] });
  assert.equal(on(del, '/product/red-rose'), false);
  assert.equal(on(del, '/shop'), true, 'but it leaves the listings');
});

test('bulk status changes carry every slug', () => {
  const bulk = ev('product.statusChanged', { ids: ['a', 'b'], slugs: ['a-slug', 'b-slug'], status: 'DRAFT' });
  assert.equal(on(bulk, '/product/b-slug'), true);
});

test('subcategory changes refresh every page (the menu is in the layout)', () => {
  const sub = ev('subcategory.updated', { ids: ['s1'] });
  for (const url of ['/', '/about', '/product/x', '/cart']) assert.equal(on(sub, url), true, url);
});

test('gifts, reviews and home content go to the pages that render them', () => {
  assert.equal(on(ev('gift.updated'), '/product/anything'), true);
  assert.equal(on(ev('gift.updated'), '/shop'), false);
  assert.equal(on(ev('review.created', { slugs: ['red-rose'] }), '/product/red-rose'), true);
  assert.equal(on(ev('review.created', { slugs: ['red-rose'] }), '/product/other'), false);
  for (const type of ['promotion.updated', 'banner.updated', 'subscriptionPlan.updated'] as const) {
    assert.equal(on(ev(type), '/'), true, type);
    assert.equal(on(ev(type), '/shop'), false, type);
  }
  assert.equal(on(ev('occasion.updated'), '/occasion/eid'), true);
  assert.equal(on(ev('blushingBlooms.updated'), '/shop?category=blushing-blooms'), true);
  assert.equal(on(ev('blushingBlooms.updated'), '/shop?category=flowers'), false);
});

test('browser-loaded data refreshes itself, not the page', () => {
  assert.equal(on(ev('delivery.updated'), '/cart'), false);
  assert.equal(on(ev('order.statusChanged', { ids: ['o1'] }), '/account/orders'), false);
});
