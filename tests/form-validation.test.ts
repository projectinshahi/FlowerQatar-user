/**
 * Regression tests for the form-validation audit fixes.
 *
 * Run with:  npm run test
 *
 * One case per rule that was added, each written as "what used to get through". These are the
 * shared schemas, so every route and every form that imports them is covered by the same test.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { passwordSchema, sendOtpSchema } from '../lib/validations/register';
import { colorVariantSchema, productSchema } from '../lib/validations/product';
import { couponSchema, promotionSchema } from '../lib/validations/marketing';
import { addItemSchema } from '../lib/validations/cart';
import { occasionSchema } from '../lib/validations/occasion';
import { createSubscriptionSchema } from '../lib/validations/subscription';
import { availableDates, TIME_SLOTS } from '../lib/delivery';
import { isValidPostalCode } from '../lib/postal';

const color = { colorName: 'Blush', colorCode: '#F5E1E1', price: 100 };
const product = {
  variants: [{ variantName: 'Standard', sku: 'SKU-1', colorVariants: [color] }],
};

describe('auth field limits', () => {
  it('rejects an email longer than the 254-character maximum', () => {
    const long = `${'a'.repeat(250)}@example.com`;
    assert.equal(sendOtpSchema.safeParse({ firstName: 'A', lastName: 'B', email: long }).success, false);
    assert.equal(
      sendOtpSchema.safeParse({ firstName: 'A', lastName: 'B', email: 'a@example.com' }).success,
      true
    );
  });

  it('rejects a password past the 72-byte bcrypt ceiling instead of truncating it', () => {
    assert.equal(passwordSchema.safeParse(`Aa1!${'x'.repeat(80)}`).success, false);
    assert.equal(passwordSchema.safeParse('Aa1!aaaa').success, true);
  });
});

describe('product pricing and identity', () => {
  it('rejects a sale price above the price', () => {
    assert.equal(colorVariantSchema.safeParse({ ...color, salePrice: 150 }).success, false);
    assert.equal(colorVariantSchema.safeParse({ ...color, salePrice: 80 }).success, true);
    // Blank stays "no sale price", which is not the same as zero.
    assert.equal(colorVariantSchema.safeParse({ ...color, salePrice: '' }).success, true);
  });

  it('rejects a colour code that is not hex', () => {
    assert.equal(colorVariantSchema.safeParse({ ...color, colorCode: 'blush' }).success, false);
    assert.equal(colorVariantSchema.safeParse({ ...color, colorCode: '#fff' }).success, true);
  });

  it('rejects a name past the column width and a subcategory id that is not a uuid', () => {
    assert.equal(productSchema.safeParse({ ...product, name: 'a'.repeat(256) }).success, false);
    assert.equal(productSchema.safeParse({ ...product, subcategoryId: 'not-an-id' }).success, false);
    // "" is what the admin select posts for "no subcategory".
    assert.equal(productSchema.safeParse({ ...product, subcategoryId: '' }).success, true);
  });
});

describe('marketing offers', () => {
  const dates = { startDate: '2026-01-01', endDate: '2026-02-01' };

  it('rejects a promotion that ends before it starts or discounts more than 100%', () => {
    assert.equal(promotionSchema.safeParse({ title: 'Spring', ...dates }).success, true);
    assert.equal(
      promotionSchema.safeParse({ title: 'Spring', startDate: '2026-02-01', endDate: '2026-01-01' }).success,
      false
    );
    assert.equal(promotionSchema.safeParse({ title: 'Spring', ...dates, discountValue: 150 }).success, false);
  });

  it('treats a whitespace-only coupon code as blank, so one is generated', () => {
    const parsed = couponSchema.parse({
      code: '   ',
      name: 'Welcome',
      type: 'PERCENTAGE',
      discountValue: 10,
      ...dates,
    });
    assert.equal(parsed.code, undefined);
  });
});

describe('cart delivery slot', () => {
  const line = { quantity: 1, unitPrice: 50 };

  it('rejects a delivery date outside the booking window', () => {
    const date = availableDates()[0];
    assert.equal(addItemSchema.safeParse({ ...line, selection: { deliveryDate: date } }).success, true);
    assert.equal(
      addItemSchema.safeParse({ ...line, selection: { deliveryDate: '2020-01-01' } }).success,
      false
    );
    assert.equal(addItemSchema.safeParse({ ...line, selection: { deliveryDate: 'tomorrow' } }).success, false);
  });

  it('rejects a time slot that is not one of the published slots', () => {
    const date = availableDates()[0];
    assert.equal(
      addItemSchema.safeParse({ ...line, selection: { deliveryDate: date, deliveryTime: TIME_SLOTS[0].id } })
        .success,
      true
    );
    assert.equal(
      addItemSchema.safeParse({ ...line, selection: { deliveryDate: date, deliveryTime: '3am' } }).success,
      false
    );
    // A slot without a date has nothing to be valid against.
    assert.equal(addItemSchema.safeParse({ ...line, selection: { deliveryTime: '9-12' } }).success, false);
  });

  it('still accepts a line with no delivery choice at all', () => {
    assert.equal(addItemSchema.safeParse({ ...line, selection: {} }).success, true);
  });
});

describe('links and discounts that are not the customer to set', () => {
  it('rejects a javascript: occasion button link', () => {
    const base = { title: 'Birthdays', subtitle: 'For them', productIds: ['0b3f5c2e-1a4d-4f8b-9c1e-2d3a4b5c6d7e'] };
    assert.equal(occasionSchema.safeParse({ ...base, buttonLink: 'javascript:alert(1)' }).success, false);
    assert.equal(occasionSchema.safeParse({ ...base, buttonLink: '/occasion/birthdays' }).success, true);
    assert.equal(occasionSchema.safeParse({ ...base, buttonLink: '' }).success, true);
  });

  it('ignores a discount sent with a subscription request', () => {
    const parsed = createSubscriptionSchema.parse({
      productId: '0b3f5c2e-1a4d-4f8b-9c1e-2d3a4b5c6d7e',
      quantity: 1,
      frequency: 'WEEKLY',
      startDate: availableDates()[0],
      discountPercent: 90,
    });
    assert.equal('discountPercent' in parsed, false);
  });
});

describe('postal codes follow the country', () => {
  it('accepts an empty postal code in Qatar, where there are none', () => {
    assert.equal(isValidPostalCode('QA', ''), true);
    assert.equal(isValidPostalCode('QA', 'DOHA-1'), true);
    // The countries that do use them are unaffected.
    assert.equal(isValidPostalCode('IN', '12345'), false);
    assert.equal(isValidPostalCode('IN', '560001'), true);
  });
});
