import { z } from 'zod';

/**
 * Validation for the global delivery-charge singleton. One schema validates the admin
 * form (via zodResolver) and both write requests (POST/PUT) — the client is never the
 * only guard.
 */

export const CHARGE_TYPES = ['FIXED', 'PERCENTAGE'] as const;
export type ChargeTypeValue = (typeof CHARGE_TYPES)[number];

export const PERCENTAGE_MAX = 100;

export const deliveryChargeSchema = z
  .object({
    /**
     * Master switch — when false nothing is charged, whatever `value` holds.
     *
     * NOT `z.coerce.boolean()`: that is JS truthiness, so the string "false" coerces to TRUE
     * and switching delivery off would silently switch it back on. Real booleans pass through;
     * the two boolean-ish strings are mapped by meaning rather than by truthiness.
     *
     * Optional rather than `.default(true)` for the same reason — a request that omits the key
     * must leave the switch alone, never force it on.
     */
    isActive: z
      .preprocess(
        (v) => (v === 'false' ? false : v === 'true' ? true : v),
        z.boolean({ message: 'Delivery charge switch must be true or false' })
      )
      .optional(),
    chargeType: z.enum(CHARGE_TYPES, { message: 'Select a charge type' }),
    // "" / null / undefined → required error (z.coerce would turn "" into 0).
    value: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z
        .number({ message: 'Value is required' })
        .refine((n) => !Number.isNaN(n), 'Value must be a number')
        .refine((n) => n >= 0, 'Value cannot be negative')
    ),
    /** Subtotal at or above which shipping is free. 0 = no free-shipping threshold. */
    freeAbove: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
      z
        .number({ message: 'Free-shipping threshold must be a number' })
        .refine((n) => !Number.isNaN(n), 'Free-shipping threshold must be a number')
        .refine((n) => n >= 0, 'Free-shipping threshold cannot be negative')
    ),
  })
  // Percentage is capped at 100; fixed has no upper limit.
  .refine((d) => d.chargeType !== 'PERCENTAGE' || d.value <= PERCENTAGE_MAX, {
    message: 'Percentage cannot exceed 100%.',
    path: ['value'],
  });

export type DeliveryChargeFormData = z.input<typeof deliveryChargeSchema>;
export type DeliveryChargeInput = z.output<typeof deliveryChargeSchema>;
