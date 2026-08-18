/**
 * Unit tests for per-category product fields.
 *
 * Run with:  npm run test
 *
 * `supportsCountry` decides both whether the admin sees the field AND whether the value is
 * persisted. A wrong answer either hides a field the category needs, or silently keeps a
 * stale country on a product with no way to edit it.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIES_WITH_COUNTRY,
  CATEGORY_ORDER,
  supportsCountry,
} from '../lib/category-config';

describe('supportsCountry', () => {
  it('is enabled for Flower', () => {
    assert.equal(supportsCountry('FLOWER'), true);
  });

  it('is disabled for every other category', () => {
    for (const type of CATEGORY_ORDER) {
      if (type === 'FLOWER') continue;
      assert.equal(supportsCountry(type), false, `${type} must not use country`);
    }
  });

  it('handles missing values rather than throwing', () => {
    // A product can legitimately have no category yet; the field must simply not apply.
    assert.equal(supportsCountry(null), false);
    assert.equal(supportsCountry(undefined), false);
    assert.equal(supportsCountry(''), false);
  });

  it('does not match an unknown or wrongly-cased value', () => {
    assert.equal(supportsCountry('flower'), false, 'category types are upper-case');
    assert.equal(supportsCountry('FLOWERS'), false);
    assert.equal(supportsCountry('NOT_A_CATEGORY'), false);
  });

  it('only lists real categories', () => {
    for (const type of CATEGORIES_WITH_COUNTRY) {
      assert.ok(CATEGORY_ORDER.includes(type), `${type} is not a known category`);
    }
  });
});
