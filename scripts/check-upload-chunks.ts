/**
 * Self-check for chunked-upload boundaries.
 * Run with:  npx tsx scripts/check-upload-chunks.ts
 *
 * These offsets decide what Cloudinary reassembles. A wrong Content-Range does not fail loudly —
 * it produces a corrupt video that only shows up when someone plays it, which is why this exists.
 */
import assert from 'node:assert/strict';
import { planChunks } from '../lib/upload-chunks';

const CHUNK = 6 * 1024 * 1024;

// The real case: the 10.6MB clip that would not upload in one request.
const real = planChunks(11080357, CHUNK);
assert.equal(real.length, 2, 'a 10.6MB file needs two 6MB parts');
assert.equal(real[0].contentRange, 'bytes 0-6291455/11080357', 'first part ends one byte before the boundary');
assert.equal(real[1].contentRange, 'bytes 6291456-11080356/11080357', 'last part ends on the final byte');
assert.equal(real[real.length - 1].sliceEnd, 11080357, 'the last slice must reach the end of the file');

// Every byte is covered exactly once, with no gap and no overlap.
for (const size of [1, CHUNK - 1, CHUNK, CHUNK + 1, 11080357, 97 * 1024 * 1024]) {
  const chunks = planChunks(size, CHUNK);
  assert.equal(chunks[0].start, 0, `${size}: must start at byte 0`);
  assert.equal(chunks[chunks.length - 1].sliceEnd, size, `${size}: must finish at the last byte`);
  let covered = 0;
  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) assert.equal(chunks[i].start, chunks[i - 1].sliceEnd, `${size}: part ${i} must resume exactly where the previous ended`);
    assert.ok(chunks[i].sliceEnd > chunks[i].start, `${size}: no empty part`);
    covered += chunks[i].sliceEnd - chunks[i].start;
  }
  assert.equal(covered, size, `${size}: parts must cover the file exactly once`);
  // Cloudinary requires every part except the last to be at least 5MB.
  for (const c of chunks.slice(0, -1)) {
    assert.ok(c.sliceEnd - c.start >= 5 * 1024 * 1024, `${size}: non-final parts must be >= 5MB`);
  }
}

// A file smaller than one chunk is a single part covering everything.
const small = planChunks(1024, CHUNK);
assert.equal(small.length, 1);
assert.equal(small[0].contentRange, 'bytes 0-1023/1024');

assert.deepEqual(planChunks(0, CHUNK), [], 'an empty file plans no parts');

console.log('chunked upload boundaries OK');
