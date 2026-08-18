/**
 * Unit tests for review summary maths and validation.
 *
 * Run with:  npm run test
 *
 * The average is published in Product JSON-LD as well as on the page, so a wrong figure is a
 * structured-data problem, not just a cosmetic one.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filledStars,
  relativeTime,
  reviewPatchSchema,
  reviewSchema,
  summarise,
} from '../lib/reviews';

const PRODUCT = '0b3f5c2e-1a4d-4f8b-9c1e-2d3a4b5c6d7e';
const base = { productId: PRODUCT, authorName: 'Sarah L.', rating: 5, content: 'Lovely.' };

describe('summarise', () => {
  it('returns null (not 0) for no reviews', () => {
    // 0 would render as "0.0 stars", i.e. uniformly terrible, rather than "not rated yet".
    const s = summarise([]);
    assert.equal(s.average, null);
    assert.equal(s.count, 0);
  });

  it('averages and rounds to one decimal', () => {
    assert.equal(summarise([5, 4]).average, 4.5);
    assert.equal(summarise([5, 4, 4]).average, 4.3); // 4.333… → 4.3
    assert.equal(summarise([5, 5, 4]).average, 4.7); // 4.666… → 4.7
  });

  it('counts each star level', () => {
    const s = summarise([5, 5, 3, 1]);
    assert.deepEqual(s.breakdown, { 1: 1, 2: 0, 3: 1, 4: 0, 5: 2 });
    assert.equal(s.count, 4);
  });

  it('ignores out-of-range and non-integer ratings', () => {
    // One bad row must not drag the headline figure somewhere impossible.
    const s = summarise([5, 0, 6, -1, 4.5, 5]);
    assert.equal(s.count, 2);
    assert.equal(s.average, 5);
  });

  it('returns null when every rating is invalid', () => {
    assert.equal(summarise([0, 9]).average, null);
  });
});

describe('filledStars', () => {
  it('rounds to the nearest whole star', () => {
    assert.equal(filledStars(4.5), 5);
    assert.equal(filledStars(4.4), 4);
  });

  it('shows none when unrated, and never exceeds the maximum', () => {
    assert.equal(filledStars(null), 0);
    assert.equal(filledStars(99), 5);
    assert.equal(filledStars(-3), 0);
  });
});

describe('relativeTime', () => {
  const now = new Date('2026-08-17T12:00:00Z');
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it('describes recent activity', () => {
    assert.equal(relativeTime(ago(30 * 1000), now), 'Just now');
    assert.equal(relativeTime(ago(5 * 60_000), now), '5 minutes ago');
    assert.equal(relativeTime(ago(2 * 3_600_000), now), '2 hours ago');
  });

  it('singularises a value of one', () => {
    assert.equal(relativeTime(ago(86_400_000), now), '1 day ago');
    assert.equal(relativeTime(ago(60_000), now), '1 minute ago');
  });

  it('describes months and years', () => {
    assert.equal(relativeTime(ago(3 * 2_592_000_000), now), '3 months ago');
    assert.equal(relativeTime(ago(2 * 31_536_000_000), now), '2 years ago');
  });

  it('never produces a negative interval when clocks disagree', () => {
    // A future timestamp (server/client skew, or a mistyped admin date) must not render
    // as "in -3 days".
    assert.equal(relativeTime(new Date(now.getTime() + 86_400_000), now), 'Just now');
  });
});

describe('reviewSchema', () => {
  it('accepts a minimal valid review and defaults to published', () => {
    const parsed = reviewSchema.parse(base);
    assert.equal(parsed.isPublished, true);
    assert.equal(parsed.title, null);
  });

  it('trims the author name and content', () => {
    const parsed = reviewSchema.parse({ ...base, authorName: '  Sarah L.  ', content: '  Hi  ' });
    assert.equal(parsed.authorName, 'Sarah L.');
    assert.equal(parsed.content, 'Hi');
  });

  it('rejects a blank author name or content', () => {
    assert.equal(reviewSchema.safeParse({ ...base, authorName: '   ' }).success, false);
    assert.equal(reviewSchema.safeParse({ ...base, content: '   ' }).success, false);
  });

  it('rejects ratings outside 1–5 and fractional ratings', () => {
    for (const rating of [0, 6, -1, 3.5]) {
      assert.equal(
        reviewSchema.safeParse({ ...base, rating }).success,
        false,
        `rating ${rating} should be rejected`
      );
    }
  });

  it('accepts both boundary ratings', () => {
    assert.equal(reviewSchema.safeParse({ ...base, rating: 1 }).success, true);
    assert.equal(reviewSchema.safeParse({ ...base, rating: 5 }).success, true);
  });

  it('rejects a non-uuid productId', () => {
    assert.equal(reviewSchema.safeParse({ ...base, productId: 'nope' }).success, false);
  });

  it('rejects over-long fields', () => {
    assert.equal(reviewSchema.safeParse({ ...base, authorName: 'a'.repeat(81) }).success, false);
    assert.equal(reviewSchema.safeParse({ ...base, title: 'a'.repeat(121) }).success, false);
    assert.equal(reviewSchema.safeParse({ ...base, content: 'a'.repeat(4001) }).success, false);
  });

  it('turns an empty title into null rather than an empty string', () => {
    assert.equal(reviewSchema.parse({ ...base, title: '   ' }).title, null);
  });
});

describe('reviewPatchSchema', () => {
  it('accepts a lone toggle without touching anything else', () => {
    assert.deepEqual(reviewPatchSchema.parse({ isPublished: false }), { isPublished: false });
  });

  it('rejects unknown fields', () => {
    // strict(): an inline toggle must never be able to rewrite the review text.
    assert.equal(reviewPatchSchema.safeParse({ content: 'hacked' }).success, false);
    assert.equal(reviewPatchSchema.safeParse({ authorName: 'x' }).success, false);
  });

  it('still enforces the rating range', () => {
    assert.equal(reviewPatchSchema.safeParse({ rating: 6 }).success, false);
  });
});
