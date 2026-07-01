import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names with Tailwind CSS class consolidation.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as USD currency.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}
