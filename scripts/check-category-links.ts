/**
 * Self-check for the category link round-trip.
 * Run with:  npx tsx scripts/check-category-links.ts
 *
 * The "All Flowers" tile links to shopCategoryHref(), and the shop page resolves that back
 * with categoryFromSlug(). If those two ever disagree the filter silently matches nothing and
 * the listing comes back empty — which looks identical to "there are no products".
 */
import assert from 'node:assert/strict';
import {
  CATEGORY_ORDER,
  categoryFromSlug,
  categorySlug,
  shopCategoryHref,
} from '../lib/category-config';

for (const type of CATEGORY_ORDER) {
  const slug = categorySlug(type);

  assert.ok(slug.length > 0, `${type} produced an empty slug`);
  assert.ok(!slug.startsWith('/'), `${type} slug must not keep a leading slash: ${slug}`);

  // The round-trip the shop page depends on.
  assert.equal(categoryFromSlug(slug), type, `categoryFromSlug('${slug}') must give back ${type}`);

  // And the href the nav actually renders must carry that same slug.
  const href = shopCategoryHref(type);
  assert.equal(href, `/shop?category=${slug}`, `unexpected href for ${type}: ${href}`);

  const param = new URL(href, 'https://x.test').searchParams.get('category');
  assert.equal(categoryFromSlug(param ?? ''), type, `href param for ${type} does not resolve back`);
}

// Slugs must be unique, or one category would resolve to another.
const slugs = CATEGORY_ORDER.map(categorySlug);
assert.equal(new Set(slugs).size, slugs.length, `duplicate category slugs: ${slugs.join(', ')}`);

// Unknown input resolves to null rather than accidentally matching the first category.
assert.equal(categoryFromSlug('not-a-category'), null);
assert.equal(categoryFromSlug(''), null);

console.log('category link round-trip OK:', slugs.join(', '));
