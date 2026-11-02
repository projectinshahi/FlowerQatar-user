import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mapDbProductToStore, type DbStoreProduct } from '../lib/store-products';
import { applyFilters, deriveFacets, EMPTY_FILTERS } from '../lib/shop-facets';
import type { Product } from '../types';

/**
 * Why these exist: a product added in the admin did not appear on its collection page. The
 * storefront was right to hide it — it had been saved with the form's default status, DRAFT,
 * and every storefront query is gated on PUBLISHED. Nothing in the pipeline was broken.
 *
 * These cover the two things that WOULD break it silently, because neither shows up as an
 * error: losing the publish gate (drafts leak onto the storefront), and losing the subcategory
 * id on the way out of the database (every product becomes "unassigned", so every collection
 * page goes empty while the category page still looks fine — exactly the reported symptom).
 */

const ROSES = 'b82002f8-5445-466a-86ae-63c2683df4d3';
const LILIES = '99703daf-d1e3-4fe3-a124-c1d05967fd13';

/** A row shaped like STORE_PRODUCT_SELECT returns it. */
function row(over: Partial<DbStoreProduct> & { id: string }): DbStoreProduct {
  return {
    slug: over.id,
    name: over.id,
    categoryType: 'FLOWER',
    subcategory: { id: ROSES, name: 'Rosse' },
    variants: [
      { isDefault: true, colorVariants: [{ isDefault: true, colorName: 'Red', price: 100 }] },
    ],
    ...over,
  };
}

describe('a published product reaches its own collection', () => {
  test('the subcategory id is what the listing filters on', () => {
    const p = mapDbProductToStore(row({ id: 'a' }));
    assert.equal(p.collection, ROSES, 'collection carries the subcategory id, not a slug or name');
    assert.equal(p.collectionName, 'Rosse', 'the display name is separate from the id');
  });

  test('it appears when the listing is filtered to that subcategory', () => {
    const products = [mapDbProductToStore(row({ id: 'a' })), mapDbProductToStore(row({ id: 'b' }))];
    const shown = applyFilters(products, { ...EMPTY_FILTERS, subcategory: ROSES });
    assert.equal(shown.length, 2);
  });

  test('a product in another subcategory does NOT appear there', () => {
    const products = [
      mapDbProductToStore(row({ id: 'rose' })),
      mapDbProductToStore(row({ id: 'lily', subcategory: { id: LILIES, name: 'Lilies' } })),
    ];
    const shown = applyFilters(products, { ...EMPTY_FILTERS, subcategory: ROSES });
    assert.deepEqual(shown.map((p) => p.id), ['rose']);
  });

  test('the category scope keeps a product out of a sibling category', () => {
    // app/(client)/shop/page.tsx scopes with `p.categoryType === activeType` before filtering.
    const products = [
      mapDbProductToStore(row({ id: 'flower' })),
      mapDbProductToStore(row({ id: 'combo', categoryType: 'GIFT_COMBOS' })),
    ];
    assert.deepEqual(products.filter((p) => p.categoryType === 'FLOWER').map((p) => p.id), ['flower']);
  });
});

describe('the subcategory id must survive the database read', () => {
  test('a product with no subcategory is unassigned, not silently placed in one', () => {
    const p = mapDbProductToStore(row({ id: 'orphan', subcategory: null }));
    assert.equal(p.collectionName, undefined);
    assert.equal(
      applyFilters([p], { ...EMPTY_FILTERS, subcategory: ROSES }).length,
      0,
      'an unassigned product must not be swept into a real collection'
    );
  });

  test('dropping `subcategory` from the select would empty every collection page', () => {
    // The regression guard: if STORE_PRODUCT_SELECT stops selecting `subcategory`, each product
    // falls back to the "signature" placeholder and no collection filter matches anything, while
    // the category listing keeps working — which is exactly how this was first reported.
    const withoutJoin = mapDbProductToStore(row({ id: 'x', subcategory: undefined }));
    assert.equal(applyFilters([withoutJoin], { ...EMPTY_FILTERS, subcategory: ROSES }).length, 0);

    const source = readFileSync(new URL('../lib/store-products.ts', import.meta.url), 'utf8');
    assert.match(
      source,
      /STORE_PRODUCT_SELECT\s*=\s*\{[\s\S]*?subcategory:\s*\{\s*select:\s*\{[^}]*id:\s*true/,
      'STORE_PRODUCT_SELECT must keep joining subcategory { id }'
    );
  });
});

describe('only published products are read from the database', () => {
  test('every product read in lib/store-products.ts is gated on PUBLISHED', () => {
    /*
     * The rule that correctly hid the draft. It lives in Prisma `where` clauses, so there is no
     * function to call — this asserts it at the source, which is the only place it exists. A new
     * query added without the gate would put drafts and archived products on the storefront.
     */
    const source = readFileSync(new URL('../lib/store-products.ts', import.meta.url), 'utf8');
    const reads = source.split(/prisma\.product\.find(?:Many|First|Unique)\(/).slice(1);
    assert.ok(reads.length >= 5, `expected the known product reads, found ${reads.length}`);
    reads.forEach((tail, i) => {
      const head = tail.slice(0, 400);
      assert.match(head, /status:\s*"PUBLISHED"/, `product read #${i + 1} is missing the PUBLISHED gate`);
    });
  });
});

describe('counts agree with the grid', () => {
  test("a subcategory's facet count equals the number of products it shows", () => {
    const products: Product[] = [
      mapDbProductToStore(row({ id: 'r1' })),
      mapDbProductToStore(row({ id: 'r2' })),
      mapDbProductToStore(row({ id: 'l1', subcategory: { id: LILIES, name: 'Lilies' } })),
    ];
    const catalogue = [
      { value: ROSES, label: 'Rosse' },
      { value: LILIES, label: 'Lilies' },
    ];
    const facets = deriveFacets(products, EMPTY_FILTERS, catalogue);
    const roses = facets.subcategories.find((s) => s.value === ROSES);
    assert.ok(roses, 'the collection is offered in the panel');
    assert.equal(roses.count, 2);
    assert.equal(
      applyFilters(products, { ...EMPTY_FILTERS, subcategory: ROSES }).length,
      roses.count,
      'the count beside a collection must match what choosing it shows'
    );
  });

  test('an empty collection is still offered, and shows an honest zero', () => {
    // A collection with nothing published in it yet must appear in the panel with a count of 0,
    // rather than vanishing — that is a real, empty listing, not a broken one.
    const products = [mapDbProductToStore(row({ id: 'r1' }))];
    const facets = deriveFacets(products, EMPTY_FILTERS, [
      { value: ROSES, label: 'Rosse' },
      { value: LILIES, label: 'Lilies' },
    ]);
    const lilies = facets.subcategories.find((s) => s.value === LILIES);
    assert.ok(lilies);
    assert.equal(lilies.count, 0);
    assert.equal(applyFilters(products, { ...EMPTY_FILTERS, subcategory: LILIES }).length, 0);
  });
});
