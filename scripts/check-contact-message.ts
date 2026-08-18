/**
 * Self-check for the contact-form subjects.
 * Run with:  npx tsx scripts/check-contact-message.ts
 *
 * The form stores a KEY (`order_issue`) while the admin inbox shows a LABEL ("Order Issue").
 * A key without a label renders as raw snake_case in the inbox, which is the sort of thing
 * nobody notices until a customer's enquiry looks broken.
 */
import assert from 'node:assert/strict';
import { SUBJECT_KEYS, SUBJECT_LABELS, subjectLabel } from '../lib/contact-message';

// The four subjects the form offers must each have a human label.
assert.deepEqual(
  SUBJECT_KEYS.sort(),
  ['order_issue', 'other', 'product_question', 'returns'].sort(),
  'subject keys changed — update the form <select> and this check together'
);

for (const key of SUBJECT_KEYS) {
  const label = subjectLabel(key);
  assert.notEqual(label, key, `subject "${key}" has no human label`);
  assert.ok(!label.includes('_'), `label for "${key}" still looks like a key: ${label}`);
}

// Known keys map to their label.
assert.equal(subjectLabel('order_issue'), 'Order Issue');
assert.equal(subjectLabel('returns'), 'Returns');

// An unknown/legacy key degrades to itself rather than rendering "undefined" in the inbox.
assert.equal(subjectLabel('something_else'), 'something_else');
assert.equal(subjectLabel(''), '');

// The API validates against these keys, so the map must not be empty.
assert.ok(Object.keys(SUBJECT_LABELS).length > 0, 'subject list must not be empty');

console.log('contact subjects OK');
