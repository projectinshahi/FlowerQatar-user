/**
 * Shipping charge rules.
 *
 * Kept free of Prisma so the arithmetic can be unit-tested directly. The admin's
 * DeliveryCharge row is the only source of truth; the fee and free-shipping threshold used to
 * be hardcoded constants in lib/services/cart.ts, which meant editing the admin screen changed
 * nothing a customer paid.
 */

export type ChargeType = 'FIXED' | 'PERCENTAGE';

export type ShippingConfig = {
  /** Master switch. False = no shipping charged, whatever `value` holds. */
  isActive: boolean;
  chargeType: ChargeType;
  /** Currency amount for FIXED, percent of subtotal for PERCENTAGE. */
  value: number;
  /** Subtotal at or above which shipping is free. 0 disables the threshold. */
  freeAbove: number;
};

/**
 * Fallback when no DeliveryCharge row exists yet.
 *
 * Deliberately ZERO rather than the old hardcoded 15: inventing a charge the admin never
 * configured would silently bill customers for something nobody set up.
 */
export const NO_SHIPPING: ShippingConfig = {
  isActive: false,
  chargeType: 'FIXED',
  value: 0,
  freeAbove: 0,
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Shipping for a given subtotal.
 *
 * Order of the rules matters and each one is a real case:
 *  1. switched off        → 0, regardless of `value`
 *  2. empty cart          → 0, so an empty basket never shows a delivery fee
 *  3. at/above freeAbove  → 0 (threshold of 0 means "no free shipping")
 *  4. otherwise           → FIXED amount, or PERCENTAGE of the subtotal
 *
 * Never returns a negative figure: a negative charge would act as a discount and could be
 * used to drive an order total below zero.
 */
export function calculateShipping(subtotal: number, config: ShippingConfig): number {
  if (!config.isActive) return 0;
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  if (config.freeAbove > 0 && subtotal >= config.freeAbove) return 0;

  const fee =
    config.chargeType === 'PERCENTAGE' ? (subtotal * config.value) / 100 : config.value;

  return round2(Math.max(0, fee));
}

/**
 * Express-courier surcharge, added on top of the base fee.
 *
 * Still a constant because the admin screen has no field for it; it is here rather than inlined
 * at three call sites so the checkout display and the placed order cannot disagree about it.
 */
export const COURIER_SURCHARGE = 35;

export type ShippingMethod = 'standard' | 'courier';

/**
 * Total shipping for a subtotal and a delivery method.
 *
 * The master switch wins over everything, the surcharge included: with delivery switched off in
 * the admin, choosing express must still cost nothing. Checking `isActive` only around the base
 * fee is what let a "free delivery" store keep billing QAR 35 for courier.
 *
 * The surcharge does apply when the base fee is waived by the free-shipping threshold — express
 * is a faster service, not a discount.
 */
export function calculateShippingForMethod(
  subtotal: number,
  config: ShippingConfig,
  method: ShippingMethod = 'standard'
): number {
  if (!config.isActive) return 0;
  const base = calculateShipping(subtotal, config);
  return method === 'courier' ? round2(base + COURIER_SURCHARGE) : base;
}

/** How much more the customer must spend to ship free, or null when not applicable. */
export function amountToFreeShipping(subtotal: number, config: ShippingConfig): number | null {
  if (!config.isActive || config.freeAbove <= 0) return null;
  if (subtotal >= config.freeAbove) return null;
  return round2(config.freeAbove - subtotal);
}
