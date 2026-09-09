/**
 * Validation tests for the delivery-charge singleton.
 *
 * The master switch decides whether customers are billed for delivery at all, so the ways it
 * could be flipped back on by accident are pinned down here.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deliveryChargeSchema } from '../lib/validations/delivery-charge';

const base = { chargeType: 'FIXED' as const, value: 20, freeAbove: 150 };

describe('deliveryChargeSchema.isActive', () => {
  it('keeps a real false', () => {
    assert.equal(deliveryChargeSchema.parse({ ...base, isActive: false }).isActive, false);
  });

  it('keeps a real true', () => {
    assert.equal(deliveryChargeSchema.parse({ ...base, isActive: true }).isActive, true);
  });

  it('reads the string "false" as OFF, not as truthy', () => {
    // z.coerce.boolean() would return true here — Boolean("false") === true — which is exactly
    // how switching delivery off could switch it back on.
    assert.equal(deliveryChargeSchema.parse({ ...base, isActive: 'false' }).isActive, false);
    assert.equal(deliveryChargeSchema.parse({ ...base, isActive: 'true' }).isActive, true);
  });

  it('leaves the switch alone when the key is absent', () => {
    // undefined means "do not touch"; Prisma skips undefined columns. Defaulting to true here
    // would let any partial update silently re-enable delivery charges.
    assert.equal(deliveryChargeSchema.parse(base).isActive, undefined);
  });

  it('rejects a value that is neither boolean nor boolean-ish', () => {
    assert.throws(() => deliveryChargeSchema.parse({ ...base, isActive: 'yes' }));
    assert.throws(() => deliveryChargeSchema.parse({ ...base, isActive: 1 }));
  });
});

describe('deliveryChargeSchema fields', () => {
  it('parses the threshold, defaulting a blank one to 0', () => {
    assert.equal(deliveryChargeSchema.parse({ ...base, freeAbove: '' }).freeAbove, 0);
    assert.equal(deliveryChargeSchema.parse({ ...base, freeAbove: '250' }).freeAbove, 250);
  });

  it('rejects negatives and an over-100 percentage', () => {
    assert.throws(() => deliveryChargeSchema.parse({ ...base, value: -1 }));
    assert.throws(() => deliveryChargeSchema.parse({ ...base, freeAbove: -1 }));
    assert.throws(() => deliveryChargeSchema.parse({ chargeType: 'PERCENTAGE', value: 101, freeAbove: 0 }));
  });
});
