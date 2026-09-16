import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { giftSchema } from '@/lib/validations/gift-group';
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

// GET /api/admin/gift-groups/:id/gifts — every gift in the group (active and inactive).
export async function GET(_request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const gifts = await prisma.gift.findMany({
      where: { giftGroupId: id },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: giftSelect,
    });
    return NextResponse.json({ gifts: gifts.map((g) => ({ ...g, price: Number(g.price) })) });
  } catch (error) {
    return fail(error, 'GET /admin/gift-groups/:id/gifts');
  }
}

// POST /api/admin/gift-groups/:id/gifts — add one gift to the group.
export async function POST(request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const data = giftSchema.parse(await request.json());

    // No existence pre-check: creating against a missing group raises P2003, which fail()
    // reports as a 404.
    // Append to the end unless the admin chose a position, so new gifts never collide.
    let displayOrder = data.displayOrder;
    if (!displayOrder) {
      const last = await prisma.gift.aggregate({
        where: { giftGroupId: id },
        _max: { displayOrder: true },
      });
      displayOrder = (last._max.displayOrder ?? 0) + 1;
    }

    const gift = await prisma.gift.create({
      data: { ...data, displayOrder, giftGroupId: id },
      select: giftSelect,
    });
    revalidateStorefront();
    return NextResponse.json({ ...gift, price: Number(gift.price) }, { status: 201 });
  } catch (error) {
    return fail(error, 'POST /admin/gift-groups/:id/gifts');
  }
}
