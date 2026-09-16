import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { logDbError } from '@/lib/prisma-error';

/**
 * Category-driven optional gifts.
 *
 * A product offers the gifts of every ACTIVE group whose category list contains the product's
 * parent Category — so assigning one category covers every product beneath it, across all of
 * that category's subcategories. Nothing here knows any category or gift by name.
 *
 * MULTIPLE MATCHING GROUPS: every matching group is returned (spec option A), ordered by
 * displayOrder ascending then name, so the lowest display order is shown first and the order
 * is stable rather than arbitrary.
 */

export interface StoreGift {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface StoreGiftGroup {
  id: string;
  name: string;
  description: string | null;
  gifts: StoreGift[];
}

/** Ids are @db.Uuid columns; a non-uuid string would make Postgres throw instead of miss. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Active groups (with their active gifts) for one category. Groups with no active gift are
 * excluded, so the storefront never renders an empty gift section.
 *
 * cache() dedupes within a request — the product page and its metadata can both call it.
 */
/*
 * Deliberately NOT wrapped in unstable_cache.
 *
 * It was, and a measured check showed the storefront lagging one edit behind: after a group
 * was created the customer still saw the old list, and after it was deleted they still saw
 * the group — revalidateTag marks the entry stale, but the next read is served from it while
 * it refreshes behind the scenes. Gift configuration decides what a customer is charged, so
 * a cache that can serve a deleted or deactivated gift is not worth the ~2s it saved.
 *
 * The cost is covered elsewhere instead: the product page fetches this alongside its other
 * queries rather than after them, so it adds no wall-clock time, and cache() below still
 * dedupes within a single request.
 */
const loadGiftGroups = cache(
  async (categoryId: string): Promise<StoreGiftGroup[]> => {
    try {
      const groups = await prisma.giftGroup.findMany({
        where: {
          isActive: true,
          categories: { some: { categoryId } },
          gifts: { some: { isActive: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          description: true,
          gifts: {
            where: { isActive: true },
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
            select: { id: true, name: true, price: true, image: true },
          },
        },
      });
      return groups.map((g) => ({
        ...g,
        gifts: g.gifts.map((gift) => ({ ...gift, price: Number(gift.price) })),
      }));
    } catch (e) {
      // Decorative data: a gift lookup must never take the product page down.
      logDbError('getGiftGroupsForCategory', e);
      return [];
    }
  }
);

/** Guards the id, then reads through the per-request dedupe above. */
export const getGiftGroupsForCategory = cache(
  async (categoryId: string | null | undefined): Promise<StoreGiftGroup[]> => {
    if (!categoryId || !UUID_RE.test(categoryId)) return [];
    return loadGiftGroups(categoryId);
  }
);

/**
 * Authoritative prices for the optional extras attached to a cart line.
 *
 * The client sends ids (and, for display, a name/price). Those prices are NEVER trusted: this
 * re-reads each id from the database. Ids cover both the new Gift rows and the older AddOn
 * rows, because both travel through the same cart `selection.addOns` channel.
 *
 * Unknown or deactivated ids are simply absent from the map, so the caller charges nothing
 * for them.
 */
export async function resolveExtraPrices(
  ids: string[]
): Promise<Map<string, { name: string; price: number }>> {
  const unique = [...new Set(ids.filter((id) => UUID_RE.test(id)))];
  const out = new Map<string, { name: string; price: number }>();
  if (!unique.length) return out;

  const [gifts, addOns] = await Promise.all([
    prisma.gift.findMany({
      where: { id: { in: unique }, isActive: true },
      select: { id: true, name: true, price: true },
    }),
    prisma.addOn.findMany({
      where: { id: { in: unique }, isActive: true },
      select: { id: true, name: true, price: true },
    }),
  ]);

  for (const row of [...addOns, ...gifts]) {
    out.set(row.id, { name: row.name, price: Number(row.price) });
  }
  return out;
}
