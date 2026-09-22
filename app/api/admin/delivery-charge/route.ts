import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deliveryChargeSchema } from '@/lib/validations/delivery-charge';
import { z } from 'zod';
import { guardAdmin } from '@/lib/admin-guard';
import { publishChange } from '@/lib/live-sync';

/** Serialize the Prisma row (Decimal → number) for the client. */
function serialize(row: {
  id: string;
  chargeType: string;
  value: unknown;
  isActive: boolean;
  freeAbove: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    chargeType: row.chargeType,
    value: Number(row.value),
    isActive: row.isActive,
    freeAbove: Number(row.freeAbove),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** GET — the singleton config, or null when it hasn't been created yet. */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const config = await prisma.deliveryCharge.findFirst();
    return NextResponse.json({ success: true, data: config ? serialize(config) : null });
  } catch (error) {
    console.error('Failed to fetch delivery charge:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch delivery charge' }, { status: 500 });
  }
}

/** POST — create the config, but only when none exists (singleton). */
export async function POST(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = deliveryChargeSchema.parse(body);

    // Reject duplicate creation even if the frontend is bypassed. The unique `singleton`
    // column is the hard backstop (P2002) for concurrent requests.
    const existing = await prisma.deliveryCharge.findFirst({ select: { id: true } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Delivery charge configuration already exists.' },
        { status: 409 }
      );
    }

    const created = await prisma.deliveryCharge.create({
      data: {
        chargeType: data.chargeType,
        value: data.value,
        freeAbove: data.freeAbove,
        // `?? true` only here: a brand-new config with no switch sent starts enabled.
        isActive: data.isActive ?? true,
      },
    });
    // Cart and checkout read shipping live; the event lets open ones re-read it.
    publishChange({ type: 'delivery.updated' });
    return NextResponse.json({ success: true, data: serialize(created) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    // Unique-constraint race → treat as "already exists".
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { success: false, message: 'Delivery charge configuration already exists.' },
        { status: 409 }
      );
    }
    console.error('Failed to create delivery charge:', error);
    return NextResponse.json({ success: false, message: 'Failed to create delivery charge' }, { status: 500 });
  }
}

/** PUT — update the existing config. 404 when it hasn't been created yet. */
export async function PUT(request: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await request.json();
    const data = deliveryChargeSchema.parse(body);

    const existing = await prisma.deliveryCharge.findFirst({ select: { id: true } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Delivery charge configuration does not exist yet.' },
        { status: 404 }
      );
    }

    /*
     * Every editable field is written. `isActive` and `freeAbove` used to be validated and then
     * dropped here, so the admin could switch delivery off, the request would succeed, and the
     * row kept isActive = true — the form then re-populated from that row and the toggle sprang
     * back on. The free-shipping threshold never saved either, for the same reason.
     *
     * `isActive` stays undefined when the request omits it, which Prisma treats as "leave the
     * column alone" rather than as false.
     */
    const updated = await prisma.deliveryCharge.update({
      where: { id: existing.id },
      data: {
        chargeType: data.chargeType,
        value: data.value,
        freeAbove: data.freeAbove,
        isActive: data.isActive,
      },
    });
    publishChange({ type: 'delivery.updated' });
    return NextResponse.json({ success: true, data: serialize(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.issues[0].message }, { status: 400 });
    }
    console.error('Failed to update delivery charge:', error);
    return NextResponse.json({ success: false, message: 'Failed to update delivery charge' }, { status: 500 });
  }
}
