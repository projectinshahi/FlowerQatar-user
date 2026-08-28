import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { revalidatePath } from 'next/cache';
import { promotionBarSchema } from '@/lib/validations/promotion-bar';
import { PROMOTION_BAR_DEFAULTS } from '@/lib/promotions';

/**
 * GET — the ticker's colours. Returns the defaults rather than null when nothing has been
 * saved yet, so the admin form opens showing the colours the storefront is actually painting
 * instead of empty swatches.
 */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const config = await prisma.promotionBarSetting.findFirst({
      select: { barColor: true, textColor: true },
    });
    return NextResponse.json({ success: true, data: config ?? PROMOTION_BAR_DEFAULTS });
  } catch (error) {
    console.error('Failed to fetch promotion bar settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch promotion bar settings' },
      { status: 500 }
    );
  }
}

/** PUT — upsert the singleton. One row only, so there is no POST or DELETE. */
export async function PUT(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = promotionBarSchema.parse(body);

    const existing = await prisma.promotionBarSetting.findFirst({ select: { id: true } });
    const saved = existing
      ? await prisma.promotionBarSetting.update({ where: { id: existing.id }, data })
      : await prisma.promotionBarSetting.create({ data });

    // The ticker lives on the home banner.
    revalidatePath('/');
    return NextResponse.json({
      success: true,
      data: { barColor: saved.barColor, textColor: saved.textColor },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    console.error('Failed to save promotion bar settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save promotion bar settings' },
      { status: 500 }
    );
  }
}
