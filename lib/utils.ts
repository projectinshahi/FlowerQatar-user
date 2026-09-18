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
