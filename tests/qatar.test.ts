import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { formatShippingAddress, isValidQatarMobile, normalizeQatarMobile, qatarLocalDigits, ZONE_PATTERN } from '../lib/qatar';

describe('Qatar mobile numbers', () => {
  it('accepts the usual ways a Qatari mobile is typed', () => {
    for (const p of ['55123456', '5512 3456', '5512-3456', '+974 5512 3456', '+97455123456', '00974 55123456', '974 55123456', '30123456', '66123456', '77123456']) {
      assert.equal(isValidQatarMobile(p), true, p);
    }
  });

  it('rejects landlines, toll-free, wrong lengths, other countries and letters', () => {
    for (const p of ['44123456', '+974 4412 3456', '80012345', '5512345', '551234567', '+971 55123456', '5512abcd', '']) {
      assert.equal(isValidQatarMobile(p), false, p);
    }
  });

  it('the +974-prefixed field keeps only the 8 local digits, typed or pasted', () => {
    assert.equal(qatarLocalDigits('5512 3456'), '55123456');
    assert.equal(qatarLocalDigits('+974 5512 3456'), '55123456');
    assert.equal(qatarLocalDigits('00974 5512 3456'), '55123456');
    assert.equal(qatarLocalDigits('551234567890'), '55123456'); // capped at 8
    assert.equal(qatarLocalDigits('55ab12'), '5512');
  });

  it('stores every accepted form as +974 and 8 digits', () => {
    assert.equal(normalizeQatarMobile('5512 3456'), '+97455123456');
    assert.equal(normalizeQatarMobile('00974-5512-3456'), '+97455123456');
    assert.equal(normalizeQatarMobile('44123456'), null);
  });
});

describe('Qatar address', () => {
  it('zone is 1–3 digits', () => {
    assert.equal(ZONE_PATTERN.test('66'), true);
    assert.equal(ZONE_PATTERN.test('1234'), false);
    assert.equal(ZONE_PATTERN.test('Doha'), false);
  });

  it('formats a new order and still formats one placed before the Qatar fields', () => {
    assert.equal(
      formatShippingAddress({ zone: '66', street: '920', building: '12', unit: '4' }),
      'Unit 4, Building 12, Street 920, Zone 66'
    );
    assert.equal(formatShippingAddress({ address: 'Villa 7', city: 'Doha', zip: '' }), 'Villa 7, Doha');
    assert.equal(formatShippingAddress(null), '');
  });
});
