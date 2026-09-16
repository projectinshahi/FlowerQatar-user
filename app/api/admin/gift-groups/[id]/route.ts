import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { guardAdmin } from '@/lib/admin-guard';
import { giftGroupPatchSchema, giftGroupSchema } from '@/lib/validations/gift-group';
import { fail, revalidateStorefront } from '@/lib/gift-groups-api';

type Context = { params: Promise<{ id: string }> };

const detailSelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  displayOrder: true,
  createdAt: true,
  updatedAt: true,
  categories: { select: { categoryId: true, category: { select: { id: true, name: true } } } },
  gifts: {
    orderBy: [{ displayOrder: 'asc' as const }, { name: 'asc' as const }],
    select: { id: true, name: true, price: true, image: true, isActive: true, displayOrder: true },
  },
};

type GiftGroupDetail = Prisma.GiftGroupGetPayload<{ select: typeof detailSelect }>;

/** Decimal -> number so the admin form gets a plain JSON number. */
function serialize(group: GiftGroupDetail) {
  return { ...group, gifts: group.gifts.map((g) => ({ ...g, price: Number(g.price) })) };
}

// GET /api/admin/gift-groups/:id — full record for the edit form (one query).
export async function GET(_request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const group = await prisma.giftGroup.findUnique({ where: { id }, select: detailSelect });
    if (!group) return NextResponse.json({ error: 'Gift group not found' }, { status: 404 });
    return NextResponse.json(serialize(group));
  } catch (error) {
    return fail(error, 'GET /admin/gift-groups/:id');
  }
}

/**
 * PUT /api/admin/gift-groups/:id — update the group, its categories and its gifts.
 *
 * Written around round trips rather than query count. Every SQL statement is a separate trip
 * to the database (over a second each on a remote instance), so this reads the group once,
 * works out in memory exactly what differs, and then sends ONLY the statements that have work
 * to do — as one transaction, so categories and gifts can never be left half-updated.
 *
 * Consequences: re-saving an unchanged group writes nothing at all, a typical edit is a couple
 * of statements, and a 50-gift group is one createMany instead of 50 inserts (that used to
 * take ~28s, past the transaction timeout, so large groups could not be saved).
 */
export async function PUT(request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const data = giftGroupSchema.parse(await request.json());

    const existing = await prisma.giftGroup.findUnique({ where: { id }, select: detailSelect });
    if (!existing) return NextResponse.json({ error: 'Gift group not found' }, { status: 404 });

    // Positions resolved up-front so every comparison below is pure data.
    const incoming = data.gifts.map((g, i) => ({ ...g, displayOrder: g.displayOrder || i }));
    const keptGiftIds = new Set(incoming.map((g) => g.id).filter(Boolean) as string[]);

    const groupChanged =
      existing.name !== data.name ||
      (existing.description ?? null) !== (data.description ?? null) ||
      existing.isActive !== data.isActive ||
      existing.displayOrder !== data.displayOrder;

    const currentCategoryIds = new Set(existing.categories.map((c) => c.categoryId));
    const wantedCategoryIds = new Set(data.categoryIds);
    const categoriesToRemove = [...currentCategoryIds].filter((c) => !wantedCategoryIds.has(c));
    const categoriesToAdd = [...wantedCategoryIds].filter((c) => !currentCategoryIds.has(c));

    const giftById = new Map(existing.gifts.map((g) => [g.id, g]));
    const giftsToRemove = existing.gifts.filter((g) => !keptGiftIds.has(g.id)).map((g) => g.id);
    const giftsToCreate = incoming.filter((g) => !g.id);
    const giftsToUpdate = incoming.filter((g) => {
      if (!g.id) return false;
      const now = giftById.get(g.id);
      if (!now) return false; // removed in another tab
      return (
        now.name !== g.name ||
        Number(now.price) !== g.price ||
        now.image !== g.image ||
        now.isActive !== g.isActive ||
        now.displayOrder !== g.displayOrder
      );
    });

    const writes: Prisma.PrismaPromise<unknown>[] = [];

    if (groupChanged) {
      writes.push(
        prisma.giftGroup.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            isActive: data.isActive,
            displayOrder: data.displayOrder,
          },
        })
      );
    }

    // De-selected categories go, newly ticked ones arrive. The unique index (plus
    // skipDuplicates) means re-saving the same selection can never duplicate a relationship.
    if (categoriesToRemove.length) {
      writes.push(
        prisma.giftGroupCategory.deleteMany({
          where: { giftGroupId: id, categoryId: { in: categoriesToRemove } },
        })
      );
    }
    if (categoriesToAdd.length) {
      writes.push(
        prisma.giftGroupCategory.createMany({
          data: categoriesToAdd.map((categoryId) => ({ giftGroupId: id, categoryId })),
          skipDuplicates: true,
        })
      );
    }

    if (giftsToRemove.length) {
      writes.push(prisma.gift.deleteMany({ where: { id: { in: giftsToRemove } } }));
    }
    if (giftsToCreate.length) {
      writes.push(
        prisma.gift.createMany({
          data: giftsToCreate.map((g) => ({
            name: g.name,
            price: g.price,
            image: g.image,
            isActive: g.isActive,
            displayOrder: g.displayOrder,
            giftGroupId: id,
          })),
        })
      );
    }
    for (const g of giftsToUpdate) {
      writes.push(
        prisma.gift.update({
          where: { id: g.id as string },
          data: {
            name: g.name,
            price: g.price,
            image: g.image,
            isActive: g.isActive,
            displayOrder: g.displayOrder,
          },
        })
      );
    }

    // Nothing differs — don't open a transaction just to write the same values back.
    if (!writes.length) return NextResponse.json(serialize(existing));

    // The refreshed record (with ids for any new gifts) rides back in the same transaction.
    writes.push(prisma.giftGroup.findUnique({ where: { id }, select: detailSelect }));

    const results = await prisma.$transaction(writes);
    const updated = results[results.length - 1] as GiftGroupDetail | null;
    if (!updated) return NextResponse.json({ error: 'Gift group not found' }, { status: 404 });

    revalidateStorefront();
    return NextResponse.json(serialize(updated));
  } catch (error) {
    return fail(error, 'PUT /admin/gift-groups/:id');
  }
}

// PATCH /api/admin/gift-groups/:id — inline row edits (activate/deactivate, reorder).
export async function PATCH(request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const data = giftGroupPatchSchema.parse(await request.json());

    // No existence pre-check: a missing row raises P2025, which fail() turns into a 404. One
    // round trip instead of two, which is what makes the optimistic toggle feel instant.
    const updated = await prisma.giftGroup.update({
      where: { id },
      data,
      select: { id: true, isActive: true, displayOrder: true },
    });
    revalidateStorefront();
    return NextResponse.json(updated);
  } catch (error) {
    return fail(error, 'PATCH /admin/gift-groups/:id');
  }
}

// DELETE /api/admin/gift-groups/:id — removes its gifts and category links by cascade.
export async function DELETE(_request: Request, { params }: Context) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    await prisma.giftGroup.delete({ where: { id } });
    revalidateStorefront();
    return NextResponse.json({ message: 'Gift group deleted' });
  } catch (error) {
    return fail(error, 'DELETE /admin/gift-groups/:id');
  }
}
