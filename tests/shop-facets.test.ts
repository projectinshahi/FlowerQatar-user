import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveFacets,
  reconcileFilters,
  applyFilters,
  sortProducts,
  parseFilters,
  EMPTY_FILTERS,
  UNASSIGNED_SUBCATEGORY,
  type ChildFilters,
} from '../lib/shop-facets';
import type { Product } from '../types';

/** Minimal product; only the fields the filter layer reads are populated. */
function product(over: Partial<Product> & { id: string }): Product {
  return {
    slug: over.id,
    name: over.id,
    price: 100,
    collection: 'sub-a',
    collectionName: 'Roses',
    colors: [],
    image: '',
    hoverImage: '',
    rating: 0,
    reviewCount: 0,
    description: '',
    ...over,
  } as Product;
}

/** No subcategory assigned in the admin — the case the live catalogue actually has. */
const orphan = (id: string, price = 100) =>
  product({ id, price, collection: undefined as unknown as string, collectionName: undefined });

const CATALOGUE: Product[] = [
  product({ id: 'a', collection: 'sub-a', collectionName: 'Lilies', price: 100, country: 'France' }),
  product({ id: 'b', collection: 'sub-a', collectionName: 'Lilies', price: 200, country: 'Ecuador' }),
  // Untagged origin, which is the common case in the real catalogue.
  product({ id: 'c', collection: 'sub-b', collectionName: 'Tulip', price: 300 }),
];

const filters = (over: Partial<ChildFilters> = {}): ChildFilters => ({ ...EMPTY_FILTERS, ...over });

test('deriveFacets', async (t) => {
  await t.test('only surfaces options present in scope', () => {
    const f = deriveFacets(CATALOGUE);
    assert.deepEqual(f.subcategories.map((s) => s.value), ['sub-a', 'sub-b']);
    assert.deepEqual(f.price, { min: 100, max: 300 });
    assert.equal(f.total, 3);
  });

  await t.test('an empty scope yields no options and no price slider', () => {
    const f = deriveFacets([]);
    assert.deepEqual(f.subcategories, []);
    assert.equal(f.price, null);
  });

  await t.test('a facet is NOT narrowed by its own selection', () => {
    // Lilies is chosen; Tulip must still be offered or the shopper is stuck.
    const f = deriveFacets(CATALOGUE, filters({ subcategory: 'sub-a' }));
    assert.deepEqual(f.subcategories.map((s) => s.value), ['sub-a', 'sub-b']);
  });

  await t.test('a facet IS narrowed by other active filters', () => {
    // Only the two 100–200 products survive a 250 ceiling, both in sub-a.
    const f = deriveFacets(CATALOGUE, filters({ maxPrice: 250 }));
    assert.deepEqual(f.subcategories.map((s) => [s.value, s.count]), [['sub-a', 2]]);
  });

  await t.test('counts never promise a combination that returns nothing', () => {
    const f = deriveFacets(CATALOGUE, filters({ maxPrice: 250 }));
    for (const sub of f.subcategories) {
      const got = applyFilters(CATALOGUE, filters({ maxPrice: 250, subcategory: sub.value }));
      assert.equal(got.length, sub.count, `subcategory ${sub.value} count disagreed with the grid`);
    }
  });
});

test('unassigned products', async (t) => {
  /*
   * The reported symptom: a category showing "All 12" above a list totalling 7, because five
   * products had no subcategory and silently dropped out of the breakdown.
   */
  const MIXED = [...CATALOGUE, orphan('x'), orphan('y')];

  await t.test('subcategory counts always sum to the scope total', () => {
    const f = deriveFacets(MIXED);
    const sum = f.subcategories.reduce((n, s) => n + s.count, 0);
    assert.equal(sum, f.total);
    assert.equal(f.total, 5);
  });

  await t.test('collects them into a trailing Other bucket', () => {
    const f = deriveFacets(MIXED);
    const last = f.subcategories[f.subcategories.length - 1];
    assert.equal(last.value, UNASSIGNED_SUBCATEGORY);
    assert.equal(last.label, 'Other');
    assert.equal(last.count, 2);
  });

  await t.test('the bucket disappears once every product is assigned', () => {
    assert.ok(!deriveFacets(CATALOGUE).subcategories.some((s) => s.value === UNASSIGNED_SUBCATEGORY));
  });

  await t.test('the bucket is selectable and returns exactly those products', () => {
    const got = applyFilters(MIXED, filters({ subcategory: UNASSIGNED_SUBCATEGORY }));
    assert.deepEqual(got.map((p) => p.slug).sort(), ['x', 'y']);
  });

  await t.test('a product with an id but no name counts as unassigned', () => {
    // getStoreProducts leaves collectionName undefined when the subcategory row is gone.
    const half = [product({ id: 'h', collection: 'sub-z', collectionName: undefined })];
    const f = deriveFacets(half);
    assert.deepEqual(f.subcategories.map((s) => s.value), [UNASSIGNED_SUBCATEGORY]);
  });

  await t.test('the bucket is dropped when the new scope has no orphans', () => {
    const { filters: out, dropped } = reconcileFilters(
      filters({ subcategory: UNASSIGNED_SUBCATEGORY }),
      CATALOGUE
    );
    assert.equal(out.subcategory, null);
    assert.deepEqual(dropped, ['subcategory']);
  });

  await t.test('the bucket survives reconciliation when orphans exist', () => {
    const { dropped } = reconcileFilters(filters({ subcategory: UNASSIGNED_SUBCATEGORY }), MIXED);
    assert.deepEqual(dropped, []);
  });
});

test('reconcileFilters', async (t) => {
  await t.test('keeps values that exist in scope', () => {
    const { filters: out, dropped } = reconcileFilters(filters({ subcategory: 'sub-a' }), CATALOGUE);
    assert.equal(out.subcategory, 'sub-a');
    assert.deepEqual(dropped, []);
  });

  await t.test('drops a subcategory belonging to another category', () => {
    // The live bug: switching category kept a filter applied with no chip to clear.
    const { filters: out, dropped } = reconcileFilters(filters({ subcategory: 'sub-zzz' }), CATALOGUE);
    assert.equal(out.subcategory, null);
    assert.deepEqual(dropped, ['subcategory']);
  });

  await t.test('drops a price ceiling that constrains nothing or everything', () => {
    assert.deepEqual(reconcileFilters(filters({ maxPrice: 300 }), CATALOGUE).dropped, ['maxPrice']);
    assert.deepEqual(reconcileFilters(filters({ maxPrice: 900 }), CATALOGUE).dropped, ['maxPrice']);
    assert.deepEqual(reconcileFilters(filters({ maxPrice: 50 }), CATALOGUE).dropped, ['maxPrice']);
    assert.deepEqual(reconcileFilters(filters({ maxPrice: 150 }), CATALOGUE).dropped, []);
  });

  await t.test('drops every child value when the scope is empty', () => {
    const { filters: out, dropped } = reconcileFilters(
      filters({ subcategory: 'sub-a', maxPrice: 120 }),
      []
    );
    assert.deepEqual(out, EMPTY_FILTERS);
    assert.deepEqual(dropped.sort(), ['maxPrice', 'subcategory']);
  });

  await t.test('reconciled filters can never produce a dead end', () => {
    const { filters: out } = reconcileFilters(
      filters({ subcategory: 'sub-b', maxPrice: 150 }),
      CATALOGUE
    );
    assert.ok(applyFilters(CATALOGUE, out).length > 0);
  });
});

test('sortProducts', async (t) => {
  await t.test('orders by price both ways', () => {
    assert.deepEqual(sortProducts(CATALOGUE, 'price-low-high').map((p) => p.price), [100, 200, 300]);
    assert.deepEqual(sortProducts(CATALOGUE, 'price-high-low').map((p) => p.price), [300, 200, 100]);
  });

  await t.test('newest ranks flagged arrivals first', () => {
    const list = [product({ id: 'old' }), product({ id: 'new', isNew: true })];
    assert.equal(sortProducts(list, 'newest')[0].slug, 'new');
  });

  await t.test('does not mutate its input', () => {
    const before = CATALOGUE.map((p) => p.slug);
    sortProducts(CATALOGUE, 'price-high-low');
    assert.deepEqual(CATALOGUE.map((p) => p.slug), before);
  });
});

test('parseFilters', async (t) => {
  await t.test('reads the canonical params', () => {
    assert.deepEqual(parseFilters({ subcategory: 'sub-a', maxPrice: '250', sort: 'newest' }), {
      subcategory: 'sub-a',
      country: null,
      maxPrice: 250,
      sort: 'newest',
    });
  });

  await t.test('accepts the legacy `collection` alias', () => {
    assert.equal(parseFilters({ collection: 'sub-a' }).subcategory, 'sub-a');
    // The canonical param wins when both are present.
    assert.equal(parseFilters({ subcategory: 'sub-b', collection: 'sub-a' }).subcategory, 'sub-b');
  });

  await t.test('ignores the retired colour param', () => {
    assert.deepEqual(parseFilters({ color: 'Crimson' }), EMPTY_FILTERS);
  });

  await t.test('coerces junk instead of throwing', () => {
    assert.deepEqual(parseFilters({ maxPrice: 'abc', sort: 'drop-tables' }), EMPTY_FILTERS);
    assert.deepEqual(parseFilters({}), EMPTY_FILTERS);
    assert.equal(parseFilters({ maxPrice: '-5' }).maxPrice, null);
  });

  await t.test('takes the first value when a param is repeated', () => {
    assert.equal(parseFilters({ subcategory: ['sub-a', 'sub-b'] }).subcategory, 'sub-a');
  });
});

test('country facet', async (t) => {
  await t.test('lists only tagged origins, alphabetically', () => {
    const f = deriveFacets(CATALOGUE);
    assert.deepEqual(f.countries.map((c) => [c.value, c.count]), [['Ecuador', 1], ['France', 1]]);
  });

  await t.test('is empty — and so hidden — when nothing in scope is tagged', () => {
    // This is what keeps the group off categories that do not record origin, without
    // hardcoding a category anywhere.
    const untagged = [product({ id: 'g', collection: 'sub-z', collectionName: 'Gifts' })];
    assert.deepEqual(deriveFacets(untagged).countries, []);
  });

  await t.test('filters to exactly the products from that country', () => {
    const got = applyFilters(CATALOGUE, filters({ country: 'France' }));
    assert.deepEqual(got.map((p) => p.slug), ['a']);
  });

  await t.test('is not narrowed by its own selection', () => {
    const f = deriveFacets(CATALOGUE, filters({ country: 'France' }));
    assert.deepEqual(f.countries.map((c) => c.value), ['Ecuador', 'France']);
  });

  await t.test('is narrowed by other active filters', () => {
    // sub-a holds France and Ecuador; sub-b holds neither.
    assert.deepEqual(
      deriveFacets(CATALOGUE, filters({ subcategory: 'sub-b' })).countries,
      []
    );
  });

  await t.test('drops an origin absent from the new category', () => {
    const other = [product({ id: 'g', collection: 'sub-z', collectionName: 'Gifts' })];
    const { filters: out, dropped } = reconcileFilters(filters({ country: 'France' }), other);
    assert.equal(out.country, null);
    assert.deepEqual(dropped, ['country']);
  });

  await t.test('is read from and cleared through the URL', () => {
    assert.equal(parseFilters({ country: 'France' }).country, 'France');
    assert.equal(parseFilters({}).country, null);
  });
});

/*
 * Published subcategories with nothing in them.
 *
 * Derivation from products alone cannot see a subcategory the admin created but has not filled,
 * so it was missing from the panel — the shopper had no way to tell it exists. Passing the
 * published list in keeps it listed, reading 0, and selectable.
 */
test('published subcategories that hold no products', async (t) => {
  const PUBLISHED = [
    { value: 'sub-a', label: 'Lilies' },
    { value: 'sub-b', label: 'Tulip' },
    { value: 'sub-empty', label: 'Orchids' },
  ];

  await t.test('an empty one is still offered, with a count of 0', () => {
    const f = deriveFacets(CATALOGUE, EMPTY_FILTERS, PUBLISHED);
    // Alphabetical by label: Lilies, Orchids, Tulip.
    assert.deepEqual(f.subcategories.map((s) => s.value), ['sub-a', 'sub-empty', 'sub-b']);
    assert.equal(f.subcategories.find((s) => s.value === 'sub-empty')!.count, 0);
  });

  await t.test('counts and labels still come from the products', () => {
    const f = deriveFacets(CATALOGUE, EMPTY_FILTERS, PUBLISHED);
    assert.equal(f.subcategories.find((s) => s.value === 'sub-a')!.count, 2);
    assert.equal(f.subcategories.find((s) => s.value === 'sub-b')!.label, 'Tulip');
    assert.equal(f.total, 3);
  });

  await t.test('selecting the empty one survives reconciliation and returns nothing', () => {
    const { filters: out, dropped } = reconcileFilters(
      filters({ subcategory: 'sub-empty' }),
      CATALOGUE,
      PUBLISHED
    );
    assert.equal(out.subcategory, 'sub-empty', 'a real but empty subcategory must not be dropped');
    assert.deepEqual(dropped, []);
    assert.deepEqual(applyFilters(CATALOGUE, out), []);
  });

  await t.test('a subcategory of another category is still dropped', () => {
    const { filters: out, dropped } = reconcileFilters(
      filters({ subcategory: 'sub-from-elsewhere' }),
      CATALOGUE,
      PUBLISHED
    );
    assert.equal(out.subcategory, null);
    assert.deepEqual(dropped, ['subcategory']);
  });

  await t.test('without the published list, behaviour is unchanged', () => {
    const f = deriveFacets(CATALOGUE);
    assert.deepEqual(f.subcategories.map((s) => s.value), ['sub-a', 'sub-b']);
  });
});
