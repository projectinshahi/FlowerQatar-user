import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { formatValidity } from '@/lib/validations/subscription-plan';
import type { PlanType } from '@prisma/client';

/** A subscription plan shaped for the UI (single number + formatted validity). */
export interface StoreSubscriptionPlan {
  id: string;
  planType: PlanType;
  name: string; // "Silver" | "Gold" | "Platinum"
  accent: string; // tier accent color (fixed per tier, not editable)
  featurePoints: number;
  price: number;
  validityYears: number;
  validityMonths: number;
  validityDays: number;
  validityLabel: string; // e.g. "6 Months"
  productCount: number;
}

// Stable display order Silver → Gold → Platinum (independent of insert order).
const PLAN_ORDER: Record<PlanType, number> = { SILVER: 0, GOLD: 1, PLATINUM: 2 };

// Fixed metallic accent per tier — makes each card read as Silver / Gold / Platinum
// without touching the global palette (used only as a subtle per-card accent).
const PLAN_ACCENT: Record<PlanType, string> = {
  SILVER: '#8A9099',
  GOLD: '#C9A227',
  PLATINUM: '#5B6B7B',
};

/** Title-case a plan name from the enum, e.g. SILVER -> Silver. */
export function planName(planType: PlanType): string {
  return planType.charAt(0) + planType.slice(1).toLowerCase();
}

/** Fixed metallic accent for a tier. */
export function planAccent(planType: PlanType): string {
  return PLAN_ACCENT[planType];
}

/** Silver → Gold → Platinum comparator. */
export function comparePlans(a: PlanType, b: PlanType): number {
  return PLAN_ORDER[a] - PLAN_ORDER[b];
}

/**
 * All three plans in Silver → Gold → Platinum order. One query with `_count` for the
 * applicable-product tally (no N+1); `cache()` de-dupes within a request. Returns [] on error.
 */
export const getSubscriptionPlans = cache(async (): Promise<StoreSubscriptionPlan[]> => {
  try {
    const rows = await prisma.subscriptionPlan.findMany({
      include: { _count: { select: { products: { where: { product: { status: 'PUBLISHED' } } } } } },
    });
    return rows
      .map((c) => ({
        id: c.id,
        planType: c.planType,
        name: planName(c.planType),
        accent: PLAN_ACCENT[c.planType],
        featurePoints: c.featurePoints,
        price: Number(c.price),
        validityYears: c.validityYears,
        validityMonths: c.validityMonths,
        validityDays: c.validityDays,
        validityLabel: formatValidity(c.validityYears, c.validityMonths, c.validityDays),
        productCount: c._count.products,
      }))
      .sort((a, b) => PLAN_ORDER[a.planType] - PLAN_ORDER[b.planType]);
  } catch (e) {
    console.error('Failed to load subscription plans:', e);
    return [];
  }
});
