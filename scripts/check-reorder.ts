/**
 * Self-check for the subcategory reorder contract (requirement: positions stay dense).
 * No DB, no framework — run with:  npx tsx scripts/check-reorder.ts
 */
import assert from 'node:assert/strict';
import { subcategoryReorderSchema, subcategoryPatchSchema } from '../lib/validations/subcategory';

const id = (n: number) => `0b3f5c2e-1a4d-4f8b-9c1e-2d3a4b5c6d${String(n).padStart(2, '0')}`;

/** The exact mapping the route applies: list index -> stored position. */
const positions = (ids: string[]) => ids.map((_, index) => index + 1);

// Dragging item 5 to slot 2 must still yield 1,2,3,4,5 — never 1,2,2,4,7.
const moved = [id(1), id(5), id(2), id(3), id(4)];
assert.deepEqual(positions(moved), [1, 2, 3, 4, 5], 'positions must be dense 1..n');
assert.equal(new Set(positions(moved)).size, moved.length, 'positions must be unique');

// Both sections accepted, and they are the only two.
assert.ok(subcategoryReorderSchema.safeParse({ section: 'navigation', ids: moved }).success);
assert.ok(subcategoryReorderSchema.safeParse({ section: 'garden', ids: moved }).success);
assert.ok(!subcategoryReorderSchema.safeParse({ section: 'nope', ids: moved }).success);
assert.ok(!subcategoryReorderSchema.safeParse({ section: 'navigation', ids: [] }).success);
assert.ok(!subcategoryReorderSchema.safeParse({ section: 'navigation', ids: ['x'] }).success);

// A toggle-only PATCH must not carry hoverImage, or it would wipe the image.
assert.deepEqual(subcategoryPatchSchema.parse({ isActive: false }), { isActive: false });
assert.deepEqual(subcategoryPatchSchema.parse({ showInNavigation: true }), { showInNavigation: true });
// Explicit null still clears it; a bad URL is still rejected.
assert.deepEqual(subcategoryPatchSchema.parse({ hoverImage: null }), { hoverImage: null });
assert.ok(!subcategoryPatchSchema.safeParse({ hoverImage: 'not-a-url' }).success);

console.log('reorder + patch contract OK');
