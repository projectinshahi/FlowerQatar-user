import { prisma } from '@/lib/prisma';

const DEFAULT_PLANS = [
  { planType: 'SILVER', featurePoints: 1100, price: 1000, validityYears: 1, validityMonths: 0, validityDays: 0 },
  { planType: 'GOLD', featurePoints: 2200, price: 2000, validityYears: 1, validityMonths: 0, validityDays: 0 },
  { planType: 'PLATINUM', featurePoints: 3300, price: 3000, validityYears: 1, validityMonths: 0, validityDays: 0 },
];

/** Ensure all 3 subscription plans exist. Creates missing ones. Run once on app start. */
export async function ensureSubscriptionPlansExist() {
  try {
    for (const plan of DEFAULT_PLANS) {
      await prisma.subscriptionPlan.upsert({
        where: { planType: plan.planType as any },
        update: { featurePoints: plan.featurePoints, price: plan.price, isActive: true },
        create: {
          planType: plan.planType as any,
          featurePoints: plan.featurePoints,
          price: plan.price,
          validityYears: plan.validityYears,
          validityMonths: plan.validityMonths,
          validityDays: plan.validityDays,
          isActive: true,
        },
      });
    }
    console.log('✓ Subscription plans initialized');
  } catch (error) {
    console.error('Failed to initialize subscription plans:', error);
  }
}
