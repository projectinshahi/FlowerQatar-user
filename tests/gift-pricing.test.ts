/**
 * Unit tests for optional-gift pricing in the cart.
 *
 * Run with:  npm run test
 *
 * These decide what a customer actually pays for a gift, so the rules that matter are pinned:
 * the client's price is never used, unknown/deactivated gifts are free, and a gift selection
 * is part of a cart line's identity.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extraIds, priceExtras } from '../lib/services/cart';

const prices = new Map([
  ['11111111-1111-4111-8111-111111111111', { name: 'Teddy Bear', price: 299 }],
  ['22222222-2222-4222-8222-222222222222', { name: 'Chocolate Box', price: 199 }],
]);

const sel = (addOns: { id: string; name: string; price: number }[]) => ({ addOns }) as never;

describe('gift pricing', () => {
  it('prices gifts from the database, ignoring the price the client sent', () => {
    const { list, total } = priceExtras(
      sel([{ id: '11111111-1111-4111-8111-111111111111', name: 'Teddy Bear', price: 1 }]),
      prices
    );
    assert.equal(total, 299);
    assert.deepEqual(list, [{ id: '11111111-1111-4111-8111-111111111111', name: 'Teddy Bear', price: 299 }]);
  });

  it('charges nothing for ids that are unknown or deactivated', () => {
    const { list, total } = priceExtras(
      sel([{ id: '33333333-3333-4333-8333-333333333333', name: 'Free Yacht', price: 0 }]),
      prices
    );
    assert.equal(total, 0);
    assert.deepEqual(list, []);
  });

  it('sums several gifts', () => {
    const { total } = priceExtras(
      sel([
        { id: '11111111-1111-4111-8111-111111111111', name: 'a', price: 0 },
        { id: '22222222-2222-4222-8222-222222222222', name: 'b', price: 0 },
      ]),
      prices
    );
    assert.equal(total, 498);
  });

  it('has no gifts, and no cost, for a line without a selection', () => {
    assert.deepEqual(extraIds(null), []);
    assert.equal(priceExtras(null, prices).total, 0);
  });

  it('identifies a gift selection regardless of the order it arrives in', () => {
    const a = extraIds(sel([
      { id: '22222222-2222-4222-8222-222222222222', name: 'b', price: 0 },
      { id: '11111111-1111-4111-8111-111111111111', name: 'a', price: 0 },
    ]));
    const b = extraIds(sel([
      { id: '11111111-1111-4111-8111-111111111111', name: 'a', price: 0 },
      { id: '22222222-2222-4222-8222-222222222222', name: 'b', price: 0 },
    ]));
    assert.deepEqual(a, b);
  });
});
