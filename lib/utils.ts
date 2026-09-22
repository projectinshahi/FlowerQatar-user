import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind CSS class consolidation.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A QAR amount in the storefront's own style ("QAR 4300", "QAR 149.7"), rounded to the fils.
 * Cart, checkout and the drawer printed these as "$4300" (the wrong currency) and, on sums of
 * decimal prices, as unrounded floats like "$149.70000000000002".
 */
export const qar = (n: number): string => `QAR ${Math.round((n + Number.EPSILON) * 100) / 100}`;

/**
 * The storefront's display locale: English digits, "." decimals, "," thousands.
 *
 * Always pass it explicitly. `toLocaleString(undefined, …)` uses the VISITOR's browser locale,
 * and client components render twice (server, then browser): an Arabic browser wrote
 * "QAR ١٠٠٫٠٠" and a German one "QAR 100,00" where the server had "QAR 100.00". React treats
 * that as a hydration mismatch (error #418) and re-renders the whole page on the client.
 */
export const DISPLAY_LOCALE = 'en-US';

/** A number in the display locale ("1,250", "30.13"); identical on server and browser. */
export const formatNumber = (n: number, options?: Intl.NumberFormatOptions): string =>
  n.toLocaleString(DISPLAY_LOCALE, options);

/**
 * A calendar date ("2026-09-23" or a Date) in the display locale, read in UTC so neither the
 * server's nor the visitor's timezone can shift it by a day.
 */
export const formatUtcDate = (d: string | Date, options: Intl.DateTimeFormatOptions): string =>
  new Date(typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T00:00:00Z` : d).toLocaleDateString(
    DISPLAY_LOCALE,
    { ...options, timeZone: 'UTC' }
  );

/**
 * Formats a number as QAR currency.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
