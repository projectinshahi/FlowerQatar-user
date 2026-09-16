import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { giftPatchSchema, giftSchema } from '@/lib/validations/gift-group';
import { fail, revalidateStorefront } from '@/lib/gift-groups-api';

type Context = { params: Promise<{ id: string }> };

const giftSelect = {
  id: true,
  name: true,
  price: true,
  image: true,
  isActive: true,
  displayOrder: true,
} as const;

// PUT /api/admin/gifts/:id — edit name / price / image / status / order.
export async function PUT(request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const data = giftSchema.parse(await request.json());

    // A missing row raises P2025, which fail() reports as a 404 — one round trip, not two.
    const gift = await prisma.gift.update({ where: { id }, data, select: giftSelect });
    revalidateStorefront();
    return NextResponse.json({ ...gift, price: Number(gift.price) });
  } catch (error) {
    return fail(error, 'PUT /admin/gifts/:id');
  }
}

// PATCH /api/admin/gifts/:id — inline activate/deactivate or reorder.
export async function PATCH(request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const data = giftPatchSchema.parse(await request.json());

    const gift = await prisma.gift.update({ where: { id }, data, select: giftSelect });
    revalidateStorefront();
    return NextResponse.json({ ...gift, price: Number(gift.price) });
  } catch (error) {
    return fail(error, 'PATCH /admin/gifts/:id');
  }
}

// DELETE /api/admin/gifts/:id
export async function DELETE(_request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.gift.delete({ where: { id } });
    revalidateStorefront();
    return NextResponse.json({ message: 'Gift deleted' });
  } catch (error) {
    return fail(error, 'DELETE /admin/gifts/:id');
  }
}
