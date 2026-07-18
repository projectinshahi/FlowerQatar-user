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
    chargeType: z.enum(CHARGE_TYPES, { message: 'Select a charge type' }),
    // "" / null / undefined → required error (z.coerce would turn "" into 0).
    value: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z
        .number({ message: 'Value is required' })
        .refine((n) => !Number.isNaN(n), 'Value must be a number')
        .refine((n) => n >= 0, 'Value cannot be negative')
    ),
  })
  // Percentage is capped at 100; fixed has no upper limit.
  .refine((d) => d.chargeType !== 'PERCENTAGE' || d.value <= PERCENTAGE_MAX, {
    message: 'Percentage cannot exceed 100%.',
    path: ['value'],
  });

export type DeliveryChargeFormData = z.input<typeof deliveryChargeSchema>;
export type DeliveryChargeInput = z.output<typeof deliveryChargeSchema>;
