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

export type PromotionBarTheme = z.infer<typeof promotionBarSchema>;

/**
 * Colours the promotion ticker was hardcoded with before the admin could set them. They are
 * the DB column defaults too, so an unsaved config and a freshly-created row look identical.
 * Lives here, not in lib/promotions.ts, so client components can import it without Prisma.
 */
export const PROMOTION_BAR_DEFAULTS: PromotionBarTheme = {
  barColor: '#b0aca7',
  textColor: '#ffffff',
};
