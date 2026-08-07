/**
 * RTL and Bidirectional text helpers for mixed English/Arabic documents.
 */

// Unicode directional control characters
export const BIDI = {
  LRM: '\u200E', // Left-to-Right Mark
  RLM: '\u200F', // Right-to-Left Mark
  LRE: '\u202A', // Left-to-Right Embedding
  RLE: '\u202B', // Right-to-Left Embedding
  PDF: '\u202C', // Pop Directional Formatting
  LRI: '\u2066', // Left-to-Right Isolate
  RLI: '\u2067', // Right-to-Left Isolate
  FSI: '\u2068', // First Strong Isolate
  PDI: '\u2069', // Pop Directional Isolate
};

/**
 * Checks if a string contains Arabic characters.
 */
export function containsArabic(text: string | null | undefined): boolean {
  if (!text) return false;
  // Arabic Unicode range \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFE
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFE]/.test(text);
}

/**
 * Wraps text in an isolated LTR directional container to prevent numbers/codes from reversing in RTL contexts.
 */
export function isolateLtr(text: string | number | null | undefined): string {
  if (text == null) return '';
  return `${BIDI.LRI}${text}${BIDI.PDI}`;
}

/**
 * Wraps text in an isolated RTL directional container.
 */
export function isolateRtl(text: string | number | null | undefined): string {
  if (text == null) return '';
  return `${BIDI.RLI}${text}${BIDI.PDI}`;
}

/**
 * Clean phone numbers and SKU codes for safe bilingual display without glyph mixing.
 */
export function formatSafeCode(code: string | null | undefined): string {
  if (!code) return '—';
  return isolateLtr(code.trim());
}
