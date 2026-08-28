import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { logDbError } from "@/lib/prisma-error";

export interface StorePromotion {
  id: string;
  title: string;
}

/**
 * Active promotions for the storefront (status ACTIVE and within their date window),
 * highest priority first. Powers the offers bar at the bottom of the home banner.
 * cache() dedupes within a request; the home page revalidates so new ones appear.
 */
export const getActivePromotions = cache(async (): Promise<StorePromotion[]> => {
  try {
    const now = new Date();
    return await prisma.promotion.findMany({
      where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: { id: true, title: true },
      take: 12,
    });
  } catch (e) {
    logDbError("getActivePromotions", e);
    return [];
  }
});

export interface PromotionBarTheme {
  barColor: string;
  textColor: string;
}

/**
 * Colours the promotion ticker was hardcoded with before the admin could set them. They are
 * the DB column defaults too, so an unsaved config and a freshly-created row look identical.
 */
export const PROMOTION_BAR_DEFAULTS: PromotionBarTheme = {
  barColor: '#b0aca7',
  textColor: '#ffffff',
};

/**
 * Admin-configured ticker colours, falling back to the defaults when the singleton has never
 * been saved. Never throws: the bar is decoration, so a database blip must not take the home
 * page down with it.
 */
export const getPromotionBarTheme = cache(async (): Promise<PromotionBarTheme> => {
  try {
    const row = await prisma.promotionBarSetting.findFirst({
      select: { barColor: true, textColor: true },
    });
    return row ?? PROMOTION_BAR_DEFAULTS;
  } catch (e) {
    logDbError('getPromotionBarTheme', e);
    return PROMOTION_BAR_DEFAULTS;
  }
});
