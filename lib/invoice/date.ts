/**
 * Bilingual date/time formatting utilities.
 */

const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

/**
 * Format date in English (e.g., "05 Aug 2026")
 */
export function formatDateEn(
  dateInput: string | Date | null | undefined,
  includeTime = false
): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '—';

  const dateStr = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  if (!includeTime) return dateStr;

  const timeStr = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return `${dateStr}, ${timeStr}`;
}

/**
 * Format date in Arabic (e.g., "05 أغسطس 2026")
 */
export function formatDateAr(
  dateInput: string | Date | null | undefined,
  includeTime = false
): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '—';

  const day = String(d.getDate()).padStart(2, '0');
  const month = ARABIC_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  const dateStr = `${day} ${month} ${year}`;

  if (!includeTime) return dateStr;

  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  const h12 = hours % 12 || 12;

  return `${dateStr}، ${h12}:${minutes} ${ampm}`;
}

/**
 * Returns dual English & Arabic formatted date strings.
 */
export function formatDateDual(
  dateInput: string | Date | null | undefined,
  includeTime = false
): { en: string; ar: string; combined: string } {
  const en = formatDateEn(dateInput, includeTime);
  const ar = formatDateAr(dateInput, includeTime);
  return {
    en,
    ar,
    combined: `${en} / ${ar}`,
  };
}
