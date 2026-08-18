/**
 * Contact-form subjects.
 *
 * The form stores a fixed key (`order_issue`), not the label — so the wording can change
 * without rewriting stored rows. Both the API (which validates the key) and the admin inbox
 * (which displays it) read from here, so the two can never disagree.
 */

export const SUBJECT_LABELS: Record<string, string> = {
  order_issue: 'Order Issue',
  product_question: 'Product Question',
  returns: 'Returns',
  other: 'Other',
};

/** The only subjects the form offers; anything else is rejected server-side. */
export const SUBJECT_KEYS = Object.keys(SUBJECT_LABELS);

/** Falls back to the raw key so an older stored value still renders as something. */
export const subjectLabel = (key: string) => SUBJECT_LABELS[key] ?? key;
