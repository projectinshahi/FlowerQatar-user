import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subscriptionPlanSchema } from '@/lib/validations/subscription-plan';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { assertProductsExist, revalidateStorefront } from '../route';

type Params = { params: Promise<{ id: string }> };

/**
 * PUT — update a plan's feature-points number, validity and applicable products.
 *
 * planType (the name) is read-only: it is never read from the body, so it can't be
 * changed. There is intentionally NO DELETE endpoint — plans are permanent.
 */
export async function PUT(request: Request, { params }: Params) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();
    const data = subscriptionPlanSchema.parse(body);

    const existing = await prisma.subscriptionPlan.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Subscription plan not found' }, { status: 404 });
    }

    if (!(await assertProductsExist(data.productIds))) {
      return NextResponse.json({ error: 'One or more selected products no longer exist' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.subscriptionPlan.update({
        where: { id },
        data: {
          featurePoints: data.featurePoints,
          price: data.price,
          validityYears: data.validityYears,
          validityMonths: data.validityMonths,
          validityDays: data.validityDays,
        },
      });
      // Product mappings: drop de-selected, add new (skipDuplicates keeps existing rows).
      await tx.subscriptionPlanProduct.deleteMany({
        where: { subscriptionPlanId: id, productId: { notIn: data.productIds } },
      });
      if (data.productIds.length) {
        await tx.subscriptionPlanProduct.createMany({
          data: data.productIds.map((productId) => ({ subscriptionPlanId: id, productId })),
          skipDuplicates: true,
        });
      }
      return tx.subscriptionPlan.findUnique({
        where: { id },
        include: { _count: { select: { products: true } } },
      });
    });

    revalidateStorefront();
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Failed to update subscription plan:', error);
    return NextResponse.json({ error: 'Failed to update subscription plan' }, { status: 500 });
  }
}
