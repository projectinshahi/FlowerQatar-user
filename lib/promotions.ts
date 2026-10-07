import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { logDbError } from "@/lib/prisma-error";
import { PROMOTION_BAR_DEFAULTS, type PromotionBarTheme } from "@/lib/validations/promotion-bar";

export const PROMOTIONS_TAG = "promotions";

export interface PromotionBarData {
  /** Titles of ACTIVE promotions inside their date window, highest priority first. */
  items: string[];
  /** Admin-configured colours; the defaults when the singleton has never been saved. */
  theme: PromotionBarTheme;
}

// Throws on a database error so the failure is never cached (see readMenuData in subcategories).
async function readPromotionBar(): Promise<PromotionBarData> {
  const now = new Date();
  const [promotions, theme] = await Promise.all([
    prisma.promotion.findMany({
      where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: { title: true },
      take: 12,
    }),
    prisma.promotionBarSetting.findFirst({ select: { barColor: true, textColor: true } }),
  ]);
  return { items: promotions.map((p) => p.title), theme: theme ?? PROMOTION_BAR_DEFAULTS };
}

// Rendered by the shared layout on every page, so it must not cost a query per request.
// Admin edits purge the tag (lib/live-sync.ts); the timer only catches a promotion's start/end date.
const loadPromotionBar = unstable_cache(readPromotionBar, ["promotion-bar-v1"], {
  tags: [PROMOTIONS_TAG],
  revalidate: 300,
});

/** Never throws: the bar is decoration, so a database blip must not take a page down with it. */
export const getPromotionBar = cache(async (): Promise<PromotionBarData> => {
  try {
    return await loadPromotionBar();
  } catch (e) {
    logDbError("getPromotionBar", e);
    return { items: [], theme: PROMOTION_BAR_DEFAULTS };
  }
});
