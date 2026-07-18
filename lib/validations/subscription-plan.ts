import { z } from 'zod';

/**
 * Validation for editing a fixed subscription plan. Plan name (planType) is NOT here —
 * it is read-only and never sent by the client. Editable: a single feature-points
 * number, the validity, and the applicable products. One schema validates the admin
 * form (via zodResolver) and the PUT request.
 */

export const subscriptionPlanSchema = z
  .object({
    // Exactly one number per plan — not a list, not repeatable.
    featurePoints: z.coerce
      .number({ message: 'Feature points must be a number' })
      .int('Feature points must be a whole number')
      .min(0, 'Feature points must be 0 or greater')
      .max(1_000_000, 'Feature points is too large'),
    // Plan price (QAR) — decimals allowed, no negatives.
    price: z.coerce
      .number({ message: 'Price must be a number' })
      .min(0, 'Price must be 0 or greater')
      .max(1_000_000, 'Price is too large')
      .default(0),
    validityYears: z.coerce.number().int().min(0, 'Years must be 0–10').max(10, 'Years must be 0–10'),
    validityMonths: z.coerce.number().int().min(0, 'Months must be 0–12').max(12, 'Months must be 0–12'),
    validityDays: z.coerce.number().int().min(0, 'Days must be 0–365').max(365, 'Days must be 0–365'),
    // Applicable products (optional). De-duped; DB also enforces uniqueness.
    productIds: z
      .array(z.string().uuid('Invalid product id'))
      .max(50, 'A plan can apply to at most 50 products')
      .default([])
      .transform((ids) => Array.from(new Set(ids))),
  })
  // At least one validity value must be greater than zero.
  .refine((d) => d.validityYears > 0 || d.validityMonths > 0 || d.validityDays > 0, {
    message: 'Set at least one validity value (years, months or days)',
    path: ['validityDays'],
  });

export type SubscriptionPlanFormData = z.input<typeof subscriptionPlanSchema>;
export type SubscriptionPlanInput = z.output<typeof subscriptionPlanSchema>;

/**
 * Human-readable validity, hiding zero parts. e.g.
 *   (1, 6, 15) -> "1 Year 6 Months 15 Days"
 *   (0, 6, 0)  -> "6 Months"
 *   (0, 0, 30) -> "30 Days"
 *   (2, 0, 0)  -> "2 Years"
 * Returns "" when all parts are zero.
 */
export function formatValidity(years: number, months: number, days: number): string {
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} Year${years === 1 ? '' : 's'}`);
  if (months > 0) parts.push(`${months} Month${months === 1 ? '' : 's'}`);
  if (days > 0) parts.push(`${days} Day${days === 1 ? '' : 's'}`);
  return parts.join(' ');
}
