import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { addressSchema, formatAddress, type Address } from '../lib/validations/address';

const valid = { label: 'Home', zone: '66', street: '920', building: '12', unit: '' };

describe('Qatar address', () => {
  it('accepts zone/street/building and drops an empty unit', () => {
    const r = addressSchema.safeParse(valid);
    assert.equal(r.success, true);
    assert.equal(r.success && r.data.unit, null);
  });

  it('requires a numeric zone of up to 3 digits', () => {
    for (const zone of ['', 'Doha', '1234', '6a']) {
      assert.equal(addressSchema.safeParse({ ...valid, zone }).success, false, zone);
    }
  });

  it('requires street and building', () => {
    assert.equal(addressSchema.safeParse({ ...valid, street: ' ' }).success, false);
    assert.equal(addressSchema.safeParse({ ...valid, building: '' }).success, false);
  });

  it('formats numbers with their names and leaves typed names alone', () => {
    const base = { id: '1', label: 'Home', countryCode: 'QA', countryName: 'Qatar', isDefault: true };
    const a: Address = { ...base, zone: '66', street: 'Al Sadd St', building: '12', unit: '4' };
    assert.equal(formatAddress(a), 'Unit 4, Building 12, Al Sadd St, Zone 66');
  });

  it('still formats an address saved before the Qatar format', () => {
    const legacy = {
      id: '1', label: 'Home', countryCode: 'QA', countryName: 'Qatar', isDefault: true,
      addressLine1: 'Villa 7', city: 'Doha', postalCode: '',
    } as unknown as Address;
    assert.equal(formatAddress(legacy), 'Villa 7, Doha');
  });
});
