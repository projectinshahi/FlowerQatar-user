import { z } from 'zod';
import { hexColor } from './color';

/**
 * Validation for the promotion-ticker appearance singleton. The same schema backs the admin
 * form and the PUT handler, so a hand-rolled request cannot write a colour the form rejects.
 */
export const promotionBarSchema = z.object({
  barColor: hexColor,
  textColor: hexColor,
});

export type PromotionBarFormData = z.infer<typeof promotionBarSchema>;
