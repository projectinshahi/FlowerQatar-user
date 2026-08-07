/**
 * Currency formatting utilities for bilingual invoices.
 */

export interface FormatCurrencyOptions {
  currency?: string;
  decimals?: number;
  showDual?: boolean; // Show both "QAR 100.00 / ١٠٠٫٠٠ ر.ق" or single
  symbolPosition?: 'prefix' | 'suffix';
}

/**
 * Formats a numeric amount into standard QAR format.
 * Example: 150 -> "QAR 150.00"
 */
export function formatCurrencyEn(amount: number | string | null | undefined, currency = 'QAR'): string {
  const num = Number(amount) || 0;
  return `${currency} ${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a numeric amount into Arabic currency format.
 * Example: 150 -> "١٥٠٫٠٠ ر.ق" or "150.00 ر.ق"
 */
export function formatCurrencyAr(
  amount: number | string | null | undefined,
  currencyAr = 'ر.ق',
  useEasternDigits = false
): string {
  const num = Number(amount) || 0;
  if (useEasternDigits) {
    const formatted = num.toLocaleString('ar-QA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ${currencyAr}`;
  }
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${currencyAr}`;
}

/**
 * Returns bilingual currency format.
 * Example: "QAR 150.00 / 150.00 ر.ق"
 */
export function formatCurrencyDual(
  amount: number | string | null | undefined,
  currencyEn = 'QAR',
  currencyAr = 'ر.ق'
): { en: string; ar: string; combined: string } {
  const en = formatCurrencyEn(amount, currencyEn);
  const ar = formatCurrencyAr(amount, currencyAr);
  return {
    en,
    ar,
    combined: `${en} · ${ar}`,
  };
}
