/**
 * Self-check for gallery media classification.
 * Run with:  npx tsx scripts/check-media.ts
 *
 * These rules decide what the cart, product cards and order lines render. Getting them wrong
 * puts a video URL inside an <img> (broken thumbnail) or hides a legitimately uploaded clip.
 */
import assert from 'node:assert/strict';
import { imagesOnly, isVideoMedia, shouldBePrimary } from '../lib/media';

const CLOUD = 'https://res.cloudinary.com/demo';

// Explicit type wins.
assert.equal(isVideoMedia({ url: `${CLOUD}/image/upload/a.jpg`, type: 'video' }), true);
assert.equal(isVideoMedia({ url: `${CLOUD}/image/upload/a.jpg`, type: 'image' }), false);

// Rows predating the `type` field must still be classified from the URL.
assert.equal(isVideoMedia({ url: `${CLOUD}/video/upload/clip` }), true, 'cloudinary video path');
assert.equal(isVideoMedia({ url: 'https://x.test/clip.mp4' }), true, '.mp4');
assert.equal(isVideoMedia({ url: 'https://x.test/clip.MOV' }), true, 'case-insensitive');
assert.equal(isVideoMedia({ url: 'https://x.test/clip.webm?v=2' }), true, 'query string');
assert.equal(isVideoMedia({ url: 'https://x.test/rose.jpg' }), false, 'plain image');

// Must not false-positive on an image that merely mentions a video word.
assert.equal(isVideoMedia({ url: 'https://x.test/mp4-poster.jpg' }), false, 'mp4 in the name');

assert.equal(isVideoMedia(null), false);
assert.equal(isVideoMedia({}), false, 'no url, no type');

// imagesOnly drops clips and anything without a url.
const mixed = [
  { url: 'a.jpg' },
  { url: 'b.mp4' },
  { url: 'c.png', type: 'image' },
  { url: undefined },
  { url: 'd.jpg', type: 'video' },
];
assert.deepEqual(
  imagesOnly(mixed).map((m) => m.url),
  ['a.jpg', 'c.png'],
  'imagesOnly must keep stills only'
);

/*
 * Primary selection. The original bug: uploading a video FIRST left the gallery with no
 * primary at all, because the check asked "is the gallery empty" rather than "does an image
 * already hold the slot".
 */
assert.equal(shouldBePrimary([], false), true, 'first image claims primary');
assert.equal(shouldBePrimary([], true), false, 'a video must never be primary');
assert.equal(
  shouldBePrimary([{ url: 'clip.mp4', type: 'video', isPrimary: false }], false),
  true,
  'image uploaded after a video must still become primary'
);
assert.equal(
  shouldBePrimary([{ url: 'a.jpg', isPrimary: true }], false),
  false,
  'an existing primary image is not displaced'
);
assert.equal(
  shouldBePrimary([{ url: 'clip.mp4', type: 'video', isPrimary: true }], false),
  true,
  'a video wrongly marked primary must be superseded by a real image'
);

console.log('gallery media classification OK');
