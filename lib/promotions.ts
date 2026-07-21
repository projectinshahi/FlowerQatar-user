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
