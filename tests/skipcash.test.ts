/**
 * Webhook authentication for SkipCash payments.
 *
 * Run with:  npm run test
 *
 * This is the check that stands between a stranger's POST and an order being marked PAID, so
 * it is the one piece of the payment flow that is pinned down here: the signed string's field
 * order, the rule that empty fields are skipped, and that anything else is refused. The rest
 * of the flow (creating a payment, verifying it, applying the effects once) needs the sandbox
 * and a database, and is covered by the sandbox test run instead.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { subscribeSchema } from '../lib/validations/membership';

import { verifyWebhookSignature } from '../lib/services/skipcash';

// Read at call time by the verifier, so setting it here is enough.
process.env.SKIPCASH_WEBHOOK_KEY = 'test-webhook-key';

const sign = (signedString: string, key = 'test-webhook-key') =>
  createHmac('sha256', key).update(signedString).digest('base64');

// Custom1 is empty here, so it is left out of the signed string entirely.
const PAYLOAD = {
  PaymentId: 'pay_123',
  Amount: '150.00',
  StatusId: 2,
  TransactionId: 'order-abc',
  Custom1: '',
  VisaId: 'visa_789',
};
const SIGNED = 'PaymentId=pay_123,Amount=150.00,StatusId=2,TransactionId=order-abc,VisaId=visa_789';

describe('verifyWebhookSignature', () => {
  it('accepts a payload signed in the documented field order, empty fields skipped', () => {
    assert.equal(verifyWebhookSignature(PAYLOAD, sign(SIGNED)), true);
  });

  it('includes Custom1 when it has a value', () => {
    const payload = { ...PAYLOAD, Custom1: 'ref-1' };
    const signed = 'PaymentId=pay_123,Amount=150.00,StatusId=2,TransactionId=order-abc,Custom1=ref-1,VisaId=visa_789';
    assert.equal(verifyWebhookSignature(payload, sign(signed)), true);
    // The old signature must not survive the extra field.
    assert.equal(verifyWebhookSignature(payload, sign(SIGNED)), false);
  });

  it('rejects a tampered amount', () => {
    assert.equal(verifyWebhookSignature({ ...PAYLOAD, Amount: '1.00' }, sign(SIGNED)), false);
  });

  it('rejects a tampered status', () => {
    assert.equal(verifyWebhookSignature({ ...PAYLOAD, StatusId: 4 }, sign(SIGNED)), false);
  });

  it('rejects a signature made with a different key', () => {
    assert.equal(verifyWebhookSignature(PAYLOAD, sign(SIGNED, 'not-the-webhook-key')), false);
  });

  it('rejects a missing or empty signature', () => {
    assert.equal(verifyWebhookSignature(PAYLOAD, null), false);
    assert.equal(verifyWebhookSignature(PAYLOAD, ''), false);
  });

  it('accepts nothing at all when no webhook key is configured', () => {
    const key = process.env.SKIPCASH_WEBHOOK_KEY;
    delete process.env.SKIPCASH_WEBHOOK_KEY;
    try {
      assert.equal(verifyWebhookSignature(PAYLOAD, sign(SIGNED)), false);
      assert.equal(verifyWebhookSignature({}, sign('')), false);
    } finally {
      process.env.SKIPCASH_WEBHOOK_KEY = key;
    }
  });
});

describe('subscribeSchema', () => {
  const body = { planId: '0b3f5c2e-1a4d-4f8b-9c1e-2d3a4b5c6d7e', idempotencyKey: 'a'.repeat(12) };

  it('accepts a plan and an idempotency key', () => {
    assert.equal(subscribeSchema.safeParse(body).success, true);
  });

  it('never takes a payment outcome or an amount from the browser', () => {
    const parsed = subscribeSchema.parse({ ...body, outcome: 'SUCCESS', amount: 0.01, price: 0 });
    assert.deepEqual(Object.keys(parsed).sort(), ['idempotencyKey', 'planId']);
  });

  it('rejects a request with no plan', () => {
    assert.equal(subscribeSchema.safeParse({ idempotencyKey: 'a'.repeat(12) }).success, false);
  });
});
