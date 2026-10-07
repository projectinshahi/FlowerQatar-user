import { prisma } from "@/lib/prisma";
import type { CartItemDTO } from "@/lib/validations/marketing";

/* ───────────────────────── Types ───────────────────────────── */

export type OfferState = "ACTIVE" | "SCHEDULED" | "EXPIRED" | "INACTIVE";

export interface CartContext {
  items: Array<CartItemDTO & { categoryId: string | null; lineTotal: number }>;
  subtotal: number;
  productIds: string[];
  categoryIds: string[];
}

export type CouponResult =
  | {
      valid: true;
      couponId: string;
      code: string;
      discount: number;
      freeDelivery: boolean;
      subtotal: number;
      updatedTotal: number;
      message: string;
    }
  | { valid: false; reason: string };

interface EligibilityLists {
  applicableProducts: string[];
  applicableCategories: string[];
  excludedProducts: string[];
  excludedCategories: string[];
}

/* ───────────────────────── Helpers ─────────────────────────── */

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Derives the display/lifecycle state of an offer from its status + date window.
 */
export function getOfferState(
  status: "ACTIVE" | "INACTIVE",
  startDate: Date,
  endDate: Date,
  now: Date = new Date()
): OfferState {
  if (status === "INACTIVE") return "INACTIVE";
  if (now < startDate) return "SCHEDULED";
  if (now > endDate) return "EXPIRED";
  return "ACTIVE";
}

/**
 * Loads the products referenced by the cart, resolving each item's category and
 * computing the cart subtotal. Prices come from the cart payload but discounts
 * are always clamped to the (re-derived) subtotal to prevent over-discounting.
 */
export async function buildCartContext(items: CartItemDTO[]): Promise<CartContext> {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, subcategoryId: true },
  });
  // "category" targeting is now backed by subcategories (the arrays hold subcategory ids).
  const categoryOf = new Map(products.map((p) => [p.id, p.subcategoryId]));

  const enriched = items.map((i) => ({
    ...i,
    categoryId: categoryOf.get(i.productId) ?? null,
    lineTotal: round2(i.price * i.quantity),
  }));

  const subtotal = round2(enriched.reduce((sum, i) => sum + i.lineTotal, 0));
  const categoryIds = [...new Set(enriched.map((i) => i.categoryId).filter(Boolean) as string[])];

  return { items: enriched, subtotal, productIds, categoryIds };
}

/**
 * Returns the subtotal of the cart items the offer applies to, honoring
 * applicable/excluded product & category lists.
 * - Empty applicable lists ⇒ the whole cart is applicable (minus exclusions).
 */
export function eligibleSubtotal(ctx: CartContext, lists: EligibilityLists): number {
  const hasApplicable =
    lists.applicableProducts.length > 0 || lists.applicableCategories.length > 0;

  let total = 0;
  for (const item of ctx.items) {
    const isExcluded =
      lists.excludedProducts.includes(item.productId) ||
      (item.categoryId != null && lists.excludedCategories.includes(item.categoryId));
    if (isExcluded) continue;

    const isApplicable =
      !hasApplicable ||
      lists.applicableProducts.includes(item.productId) ||
      (item.categoryId != null && lists.applicableCategories.includes(item.categoryId));
    if (!isApplicable) continue;

    total += item.lineTotal;
  }
  return round2(total);
}

/**
 * Computes a discount amount for a base value given a discount type/value.
 */
export function computeDiscount(
  base: number,
  type: "FLAT" | "PERCENTAGE",
  value: number,
  maxDiscount: number | null
): number {
  let discount = type === "FLAT" ? value : (base * value) / 100;
  if (maxDiscount != null && maxDiscount > 0) discount = Math.min(discount, maxDiscount);
  discount = Math.min(discount, base); // never exceed the eligible base
  return round2(Math.max(0, discount));
}

/* ───────────────────────── Coupons ─────────────────────────── */

/**
 * Full rule evaluation for a coupon against a cart. Pure business logic —
 * does not mutate usage counters (usage is recorded when the order is paid, in services/order.ts).
 */
export async function validateCoupon(
  code: string,
  items: CartItemDTO[],
  userId: string | null
): Promise<CouponResult> {
  // The cart context does not depend on the coupon, so both reads go out together.
  const [coupon, ctx] = await Promise.all([
    prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } }),
    buildCartContext(items),
  ]);

  if (!coupon) return { valid: false, reason: "Invalid coupon code" };
  if (coupon.status !== "ACTIVE") return { valid: false, reason: "This coupon is not active" };

  const now = new Date();
  if (now < coupon.startDate) return { valid: false, reason: "This coupon is not active yet" };
  if (now > coupon.endDate) return { valid: false, reason: "This coupon has expired" };

  if (coupon.usageLimit != null && coupon.currentUsage >= coupon.usageLimit) {
    return { valid: false, reason: "This coupon has reached its usage limit" };
  }

  if (coupon.usagePerCustomer != null) {
    if (!userId) return { valid: false, reason: "Please sign in to use this coupon" };
    const used = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (used >= coupon.usagePerCustomer) {
      return { valid: false, reason: "You have already used this coupon" };
    }
  }

  if (ctx.subtotal < Number(coupon.minOrderAmount)) {
    const needed = round2(Number(coupon.minOrderAmount) - ctx.subtotal);
    return { valid: false, reason: `Add QAR ${needed.toFixed(2)} more to use this coupon` };
  }

  const base = eligibleSubtotal(ctx, {
    applicableProducts: coupon.applicableProducts,
    applicableCategories: coupon.applicableCategories,
    excludedProducts: coupon.excludedProducts,
    excludedCategories: coupon.excludedCategories,
  });

  if (base <= 0) {
    return { valid: false, reason: "This coupon does not apply to the items in your cart" };
  }

  const discount = computeDiscount(
    base,
    coupon.type,
    Number(coupon.discountValue),
    coupon.maxDiscount != null ? Number(coupon.maxDiscount) : null
  );

  return {
    valid: true,
    couponId: coupon.id,
    code: coupon.code,
    discount,
    freeDelivery: coupon.freeDelivery,
    subtotal: ctx.subtotal,
    updatedTotal: round2(ctx.subtotal - discount),
    message: coupon.freeDelivery
      ? `Coupon applied — you saved QAR ${discount.toFixed(2)} + free delivery`
      : `Coupon applied — you saved QAR ${discount.toFixed(2)}`,
  };
}

/* ─────────────────────── Promotions ────────────────────────── */

export interface PromotionResult {
  applied: boolean;
  promotion?: { id: string; title: string; promotionType: string };
  discount: number;
  subtotal: number;
  updatedTotal: number;
}

/**
 * Auto-detects active, auto-apply promotions and returns the single best one
 * (highest priority, then highest discount). Offers are never stacked.
 */
export async function applyBestPromotion(items: CartItemDTO[]): Promise<PromotionResult> {
  const now = new Date();
  const [ctx, promotions] = await Promise.all([
    buildCartContext(items),
    prisma.promotion.findMany({
      where: {
        status: "ACTIVE",
        autoApply: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ priority: "desc" }, { discountValue: "desc" }],
    }),
  ]);

  let best: PromotionResult | null = null;

  for (const promo of promotions) {
    const base = eligibleSubtotal(ctx, {
      applicableProducts: promo.applicableProducts,
      applicableCategories: promo.applicableCategories,
      excludedProducts: promo.excludedProducts,
      excludedCategories: promo.excludedCategories,
    });
    if (base <= 0) continue;

    const discount = computeDiscount(
      base,
      promo.discountType,
      Number(promo.discountValue),
      promo.maxDiscount != null ? Number(promo.maxDiscount) : null
    );
    if (discount <= 0) continue;

    // promotions are pre-sorted by priority desc; first eligible with a discount wins
    best = {
      applied: true,
      promotion: { id: promo.id, title: promo.title, promotionType: promo.promotionType },
      discount,
      subtotal: ctx.subtotal,
      updatedTotal: round2(ctx.subtotal - discount),
    };
    break;
  }

  return best ?? { applied: false, discount: 0, subtotal: ctx.subtotal, updatedTotal: ctx.subtotal };
}

/* ─────────────────── Free Delivery Campaigns ───────────────── */

export interface FreeDeliveryResult {
  eligible: boolean;
  remaining: number;
  campaign?: { id: string; name: string; minOrderAmount: number };
}

/**
 * Checks whether the cart qualifies for free delivery under any active campaign.
 * When not yet eligible, returns the smallest remaining amount to reach one.
 */
export async function checkFreeDelivery(items: CartItemDTO[]): Promise<FreeDeliveryResult> {
  const now = new Date();
  const [ctx, campaigns] = await Promise.all([
    buildCartContext(items),
    prisma.freeDeliveryCampaign.findMany({
      where: {
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ priority: "desc" }, { minOrderAmount: "asc" }],
    }),
  ]);

  let closest: FreeDeliveryResult | null = null;

  for (const c of campaigns) {
    const base = eligibleSubtotal(ctx, {
      applicableProducts: c.applicableProducts,
      applicableCategories: c.applicableCategories,
      excludedProducts: [],
      excludedCategories: [],
    });
    const min = Number(c.minOrderAmount);
    const info = { id: c.id, name: c.name, minOrderAmount: min };

    if (base >= min) {
      return { eligible: true, remaining: 0, campaign: info };
    }
    const remaining = round2(min - base);
    if (!closest || remaining < closest.remaining) {
      closest = { eligible: false, remaining, campaign: info };
    }
  }

  return closest ?? { eligible: false, remaining: 0 };
}
