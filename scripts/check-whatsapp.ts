/**
 * Self-check for the WhatsApp button's number handling.
 * Run with:  npx tsx scripts/check-whatsapp.ts
 *
 * wa.me silently opens a broken chat for a malformed number, so the sanitising and the
 * "don't render without a real number" rule are the parts worth pinning down.
 */
import assert from 'node:assert/strict';

// Mirrors components/WhatsAppButton.tsx. Keep the two in step.
const toWaNumber = (raw: string) => raw.replace(/\D/g, '');
const renders = (raw: string | undefined) => toWaNumber(raw ?? '').length >= 8;

// Formats a business might paste in, all reducing to the same digits.
assert.equal(toWaNumber('+974 3012 3456'), '97430123456');
assert.equal(toWaNumber('+974-3012-3456'), '97430123456');
assert.equal(toWaNumber('(974) 3012 3456'), '97430123456');
assert.equal(toWaNumber('97430123456'), '97430123456');

// Nothing configured, or a half-filled placeholder → button must not render.
assert.equal(renders(undefined), false, 'unset env must hide the button');
assert.equal(renders(''), false, 'empty env must hide the button');
assert.equal(renders('   '), false, 'whitespace must hide the button');
assert.equal(renders('+974'), false, 'country code alone is not a number');
assert.equal(renders('1234567'), false, 'too short to be a real line');

// A complete number renders.
assert.equal(renders('+974 3012 3456'), true);

// The prefilled message must survive URL encoding.
const message = "Hello Lebami, I'd like to ask about your arrangements.";
const href = `https://wa.me/${toWaNumber('+974 3012 3456')}?text=${encodeURIComponent(message)}`;
assert.ok(href.startsWith('https://wa.me/97430123456?text='), 'href shape');
assert.ok(!href.includes(' '), 'no raw spaces in the query string');
assert.equal(decodeURIComponent(href.split('text=')[1]), message, 'message round-trips');

console.log('whatsapp number handling OK');
