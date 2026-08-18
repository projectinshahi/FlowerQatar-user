/**
 * Unit tests for stock availability rules and request validation.
 *
 * Run with:  npm run test
 *
 * Uses node:test — no test framework dependency. Covers the pure rules and the request
 * schemas; the guarded-UPDATE concurrency guarantee in lib/services/stock.ts needs a real
 * database and is called out in the report rather than faked here.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_BATCH_ITEMS,
  MAX_QUANTITY,
  availabilityRequestSchema,
  availableUnits,
  canReserve,
  releasedReserved,
  resolveAvailability,
  setStockSchema,
  stockKeyOf,
} from '../lib/stock';

const PRODUCT = '0b3f5c2e-1a4d-4f8b-9c1e-2d3a4b5c6d7e';
const key = { productId: PRODUCT, variantId: 'v1', colorId: 'c1' };
const rec = (quantity: number, reserved = 0, lowStockThreshold = 0) => ({
  quantity,
  reserved,
  lowStockThreshold,
});

describe('availableUnits', () => {
  it('subtracts reservations from quantity', () => {
    assert.equal(availableUnits(rec(10, 3)), 7);
  });

  it('never returns a negative figure', () => {
    // Stock can be written down while orders are still pending. A negative result would
    // read as a credit and let later orders through.
    assert.equal(availableUnits(rec(2, 5)), 0);
  });
});

describe('resolveAvailability', () => {
  it('treats a missing row as untracked and always sellable', () => {
    // Critical: nothing has stock rows yet, so "missing = zero" would take the whole
    // catalogue offline the moment this shipped.
    const a = resolveAvailability(null, 999);
    assert.equal(a.status, 'not_tracked');
    assert.equal(a.tracked, false);
    assert.equal(a.available, null);
    assert.equal(a.canFulfil, true);
  });

  it('reports in_stock when comfortably above the threshold', () => {
    const a = resolveAvailability(rec(10, 0, 2), 1);
    assert.equal(a.status, 'in_stock');
    assert.equal(a.available, 10);
    assert.equal(a.canFulfil, true);
  });

  it('reports low_stock at or below the threshold', () => {
    assert.equal(resolveAvailability(rec(2, 0, 2), 1).status, 'low_stock');
    assert.equal(resolveAvailability(rec(1, 0, 2), 1).status, 'low_stock');
  });

  it('reports out_of_stock at zero, never low_stock', () => {
    const a = resolveAvailability(rec(5, 5, 2), 1);
    assert.equal(a.status, 'out_of_stock');
    assert.equal(a.available, 0);
    assert.equal(a.canFulfil, false);
  });

  it('fulfils exactly the available quantity but not one more', () => {
    assert.equal(resolveAvailability(rec(3), 3).canFulfil, true);
    assert.equal(resolveAvailability(rec(3), 4).canFulfil, false);
  });

  it('counts reserved units as unavailable', () => {
    // The last unit is promised to a pending order, so a second shopper cannot have it.
    assert.equal(resolveAvailability(rec(1, 1), 1).canFulfil, false);
  });
});

describe('canReserve', () => {
  it('rejects zero and negative quantities', () => {
    assert.equal(canReserve(rec(10), 0), false);
    assert.equal(canReserve(rec(10), -1), false);
  });

  it('allows untracked units', () => {
    assert.equal(canReserve(null, 5), true);
  });

  it('allows up to the available figure only', () => {
    assert.equal(canReserve(rec(5, 2), 3), true);
    assert.equal(canReserve(rec(5, 2), 4), false);
  });
});

describe('releasedReserved', () => {
  it('returns the remaining reservation', () => {
    assert.equal(releasedReserved(5, 2), 3);
  });

  it('floors at zero on a double release', () => {
    // A retried cancellation must not create a negative reservation, which would inflate
    // availability for every later shopper.
    assert.equal(releasedReserved(2, 5), 0);
    assert.equal(releasedReserved(0, 1), 0);
  });
});

describe('stockKeyOf', () => {
  it('is stable and distinguishes each field', () => {
    assert.equal(stockKeyOf(key), `${PRODUCT}|v1|c1`);
    assert.notEqual(stockKeyOf(key), stockKeyOf({ ...key, colorId: 'c2' }));
    assert.notEqual(stockKeyOf(key), stockKeyOf({ ...key, variantId: 'v2' }));
  });
});

describe('availabilityRequestSchema', () => {
  it('accepts a valid batch and defaults quantity to 1', () => {
    const parsed = availabilityRequestSchema.parse({ items: [key] });
    assert.equal(parsed.items[0].quantity, 1);
  });

  it('rejects an empty batch', () => {
    const r = availabilityRequestSchema.safeParse({ items: [] });
    assert.equal(r.success, false);
  });

  it('rejects a batch over the cap', () => {
    const items = Array.from({ length: MAX_BATCH_ITEMS + 1 }, () => ({ ...key }));
    assert.equal(availabilityRequestSchema.safeParse({ items }).success, false);
  });

  it('rejects a non-uuid productId', () => {
    const r = availabilityRequestSchema.safeParse({ items: [{ ...key, productId: 'nope' }] });
    assert.equal(r.success, false);
  });

  it('rejects blank variant or colour ids', () => {
    assert.equal(
      availabilityRequestSchema.safeParse({ items: [{ ...key, variantId: '   ' }] }).success,
      false
    );
    assert.equal(
      availabilityRequestSchema.safeParse({ items: [{ ...key, colorId: '' }] }).success,
      false
    );
  });

  it('rejects zero, negative, fractional and oversized quantities', () => {
    for (const quantity of [0, -1, 1.5, MAX_QUANTITY + 1]) {
      const r = availabilityRequestSchema.safeParse({ items: [{ ...key, quantity }] });
      assert.equal(r.success, false, `quantity ${quantity} should be rejected`);
    }
  });

  it('reports which line of the batch failed', () => {
    const r = availabilityRequestSchema.safeParse({
      items: [key, { ...key, productId: 'bad' }],
    });
    assert.equal(r.success, false);
    if (!r.success) assert.deepEqual(r.error.issues[0].path.slice(0, 2), ['items', 1]);
  });

  it('rejects a missing or malformed body', () => {
    assert.equal(availabilityRequestSchema.safeParse({}).success, false);
    assert.equal(availabilityRequestSchema.safeParse(null).success, false);
    assert.equal(availabilityRequestSchema.safeParse({ items: 'x' }).success, false);
  });
});

describe('setStockSchema', () => {
  it('accepts zero (deliberately marking a unit sold out)', () => {
    const parsed = setStockSchema.parse({ ...key, quantity: 0 });
    assert.equal(parsed.quantity, 0);
    assert.equal(parsed.lowStockThreshold, 0);
  });

  it('rejects a negative quantity or threshold', () => {
    assert.equal(setStockSchema.safeParse({ ...key, quantity: -1 }).success, false);
    assert.equal(
      setStockSchema.safeParse({ ...key, quantity: 5, lowStockThreshold: -1 }).success,
      false
    );
  });

  it('rejects a fractional quantity', () => {
    assert.equal(setStockSchema.safeParse({ ...key, quantity: 2.5 }).success, false);
  });

  it('rejects an absurd quantity (likely a typo or abuse)', () => {
    assert.equal(setStockSchema.safeParse({ ...key, quantity: 10_000_000 }).success, false);
  });

  it('does not accept a `reserved` field from the client', () => {
    // Reservations belong to in-flight orders; letting an admin body set them would corrupt
    // availability for pending checkouts.
    const parsed = setStockSchema.parse({ ...key, quantity: 5, reserved: 99 });
    assert.equal('reserved' in parsed, false);
  });
});
