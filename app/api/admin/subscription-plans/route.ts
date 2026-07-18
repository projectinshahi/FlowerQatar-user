import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { revalidatePath } from 'next/cache';
import { planName, planAccent, comparePlans } from '@/lib/subscription-plans';

/** Plans render on the storefront home page, so writes must refresh it. */
export function revalidateStorefront() {
  revalidatePath('/');
}

/** Rejects ids that don't exist so mappings never point at missing products. */
export async function assertProductsExist(productIds: string[]) {
  if (productIds.length === 0) return true;
  const found = await prisma.product.count({ where: { id: { in: productIds } } });
  return found === productIds.length;
}

/**
 * GET — all three plans (Silver, Gold, Platinum) in order, each with its single feature
 * number, validity, and applicable product ids (for the edit form). There is intentionally
 * NO POST endpoint: plans are fixed and can never be added.
 */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const rows = await prisma.subscriptionPlan.findMany({
      include: { products: { select: { productId: true } } },
    });
    const plans = rows
      .map((c) => ({
        id: c.id,
        planType: c.planType,
        name: planName(c.planType),
        accent: planAccent(c.planType),
        featurePoints: c.featurePoints,
        price: Number(c.price),
        validityYears: c.validityYears,
        validityMonths: c.validityMonths,
        validityDays: c.validityDays,
        productIds: c.products.map((p) => p.productId),
      }))
      .sort((a, b) => comparePlans(a.planType, b.planType));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Failed to fetch subscription plans:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription plans' }, { status: 500 });
  }
}
