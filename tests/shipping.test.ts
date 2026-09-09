/**
 * Unit tests for shipping charge rules.
 *
 * Run with:  npm run test
 *
 * These decide what a customer actually pays, so the off-switch, the free-shipping threshold
 * and the empty-cart case are all pinned down.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  COURIER_SURCHARGE,
  NO_SHIPPING,
  amountToFreeShipping,
  calculateShipping,
  calculateShippingForMethod,
  type ShippingConfig,
} from '../lib/shipping';

const fixed = (value: number, freeAbove = 0, isActive = true): ShippingConfig => ({
  isActive,
  chargeType: 'FIXED',
  value,
  freeAbove,
});
const percent = (value: number, freeAbove = 0, isActive = true): ShippingConfig => ({
  isActive,
  chargeType: 'PERCENTAGE',
  value,
  freeAbove,
});

describe('calculateShipping — the off switch', () => {
  it('charges nothing when switched off, whatever the value says', () => {
    // The whole point of the toggle: the configured amount is retained but not applied.
    assert.equal(calculateShipping(100, fixed(15, 0, false)), 0);
    assert.equal(calculateShipping(100, percent(10, 0, false)), 0);
  });

  it('charges again once switched back on, using the retained value', () => {
    assert.equal(calculateShipping(100, fixed(15, 0, true)), 15);
  });

  it('defaults to no shipping when nothing is configured', () => {
    // A missing config must not invent a charge nobody set up.
    assert.equal(NO_SHIPPING.isActive, false);
    assert.equal(calculateShipping(100, NO_SHIPPING), 0);
  });
});

describe('calculateShipping — empty and invalid carts', () => {
  it('charges nothing on an empty cart', () => {
    assert.equal(calculateShipping(0, fixed(15)), 0);
  });

  it('charges nothing on a negative or non-finite subtotal', () => {
    assert.equal(calculateShipping(-10, fixed(15)), 0);
    assert.equal(calculateShipping(Number.NaN, fixed(15)), 0);
    assert.equal(calculateShipping(Number.POSITIVE_INFINITY, fixed(15)), 0);
  });
});

describe('calculateShipping — free-shipping threshold', () => {
  it('is free at exactly the threshold', () => {
    assert.equal(calculateShipping(150, fixed(15, 150)), 0);
  });

  it('still charges one unit below the threshold', () => {
    assert.equal(calculateShipping(149.99, fixed(15, 150)), 15);
  });

  it('treats a threshold of 0 as "always charge"', () => {
    // 0 must not be read as "everything qualifies" — that would make shipping always free.
    assert.equal(calculateShipping(1, fixed(15, 0)), 15);
    assert.equal(calculateShipping(10_000, fixed(15, 0)), 15);
  });
});

describe('calculateShipping — charge types', () => {
  it('adds a flat amount for FIXED', () => {
    assert.equal(calculateShipping(80, fixed(15)), 15);
  });

  it('takes a share of the subtotal for PERCENTAGE', () => {
    assert.equal(calculateShipping(200, percent(10)), 20);
  });

  it('rounds to two decimals', () => {
    // 33.33 * 7.5% = 2.49975 — must not leak floating-point noise into an order total.
    assert.equal(calculateShipping(33.33, percent(7.5)), 2.5);
  });

  it('never returns a negative charge', () => {
    // A negative fee would act as a discount and could drive an order total below zero.
    assert.equal(calculateShipping(100, fixed(-20)), 0);
    assert.equal(calculateShipping(100, percent(-10)), 0);
  });
});

describe('amountToFreeShipping', () => {
  it('reports how much more is needed', () => {
    assert.equal(amountToFreeShipping(120, fixed(15, 150)), 30);
  });

  it('returns null once the threshold is met', () => {
    assert.equal(amountToFreeShipping(150, fixed(15, 150)), null);
  });

  it('returns null when shipping is off or there is no threshold', () => {
    assert.equal(amountToFreeShipping(10, fixed(15, 150, false)), null);
    assert.equal(amountToFreeShipping(10, fixed(15, 0)), null);
  });
});

describe('calculateShippingForMethod', () => {
  const ON: ShippingConfig = { isActive: true, chargeType: 'FIXED', value: 15, freeAbove: 150 };
  const OFF: ShippingConfig = { ...ON, isActive: false };

  it('adds the courier surcharge on top of the base fee', () => {
    assert.equal(calculateShippingForMethod(100, ON, 'standard'), 15);
    assert.equal(calculateShippingForMethod(100, ON, 'courier'), 15 + COURIER_SURCHARGE);
  });

  it('still charges the surcharge when the base fee is waived', () => {
    // Express is a faster service, not a discount.
    assert.equal(calculateShippingForMethod(200, ON, 'standard'), 0);
    assert.equal(calculateShippingForMethod(200, ON, 'courier'), COURIER_SURCHARGE);
  });

  it('the master switch zeroes BOTH methods', () => {
    // The reported bug: delivery switched off in the admin still billed for courier.
    assert.equal(calculateShippingForMethod(100, OFF, 'standard'), 0);
    assert.equal(calculateShippingForMethod(100, OFF, 'courier'), 0);
    assert.equal(calculateShippingForMethod(9999, OFF, 'courier'), 0);
  });

  it('an unconfigured store charges nothing', () => {
    assert.equal(calculateShippingForMethod(100, NO_SHIPPING, 'courier'), 0);
  });

  it('defaults to standard when no method is given', () => {
    assert.equal(calculateShippingForMethod(100, ON), 15);
  });
});
