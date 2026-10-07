/**
 * Qatar address and phone rules, shared by the checkout, the saved-address book and every place
 * an address is shown — so the browser and the server always agree. Free of zod on purpose:
 * the checkout imports it, and zod would add ~60KB to that page.
 */

/** Zone number from the building's blue plate (Qatar's national address): 1–3 digits. */
export const ZONE_PATTERN = /^\d{1,3}$/;

/**
 * A Qatari mobile number as 8 digits, or null. Accepts the usual ways people type one:
 * "5512 3456", "5512-3456", "+974 5512 3456", "00974 55123456". Mobile numbers start with
 * 3, 5, 6 or 7; 4 is landlines and 8 toll-free, which a courier cannot text or WhatsApp.
 */
function qatarMobileDigits(phone: string): string | null {
  const raw = phone.trim();
  if (!/^[+\d\s()-]+$/.test(raw)) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00974')) digits = digits.slice(5);
  else if (digits.length === 11 && digits.startsWith('974')) digits = digits.slice(3);
  return /^[3567]\d{7}$/.test(digits) ? digits : null;
}

export const isValidQatarMobile = (phone: string) => qatarMobileDigits(phone) !== null;

/**
 * For a field with a fixed +974 prefix: the local digits from whatever was typed or pasted,
 * at most 8. "+974 5512 3456" and "00974 5512 3456" both give "55123456". No local number
 * starts with 9, so a leading 974 is always the country code.
 */
export function qatarLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00974')) digits = digits.slice(5);
  else if (digits.startsWith('974') && digits.length > 8) digits = digits.slice(3);
  return digits.slice(0, 8);
}

/** "+974XXXXXXXX", or null when the number is not a Qatari mobile. */
export function normalizeQatarMobile(phone: string): string | null {
  const digits = qatarMobileDigits(phone);
  return digits ? `+974${digits}` : null;
}

export interface QatarAddress {
  zone: string;
  street: string;
  building: string;
  unit?: string | null;
}

/** "Unit 4, Building 12, Street 920, Zone 66". Typed names ("Al Sadd St") stand alone. */
export function formatQatarAddress(a: QatarAddress): string {
  const tag = (name: string, v?: string | null) => v && (/^\d+$/.test(v) ? `${name} ${v}` : v);
  return [tag('Unit', a.unit), tag('Building', a.building), tag('Street', a.street), tag('Zone', a.zone)]
    .filter(Boolean)
    .join(', ');
}

/**
 * One-line delivery address from an order's stored shippingInfo. Orders placed before the
 * Qatar format carry address / city / zip instead, and still display.
 */
export function formatShippingAddress(si: Record<string, unknown> | null | undefined): string {
  const s = (k: string) => (typeof si?.[k] === 'string' ? (si[k] as string) : '');
  if (s('zone')) return formatQatarAddress({ zone: s('zone'), street: s('street'), building: s('building'), unit: s('unit') });
  return [s('address'), s('city'), s('zip')].filter(Boolean).join(', ');
}
