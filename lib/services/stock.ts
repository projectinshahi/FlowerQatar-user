import { prisma } from '@/lib/prisma';
import {
  type AvailabilityItem,
  type Availability,
  type SetStockInput,
  type StockKey,
  type StockRecord,
  resolveAvailability,
  stockKeyOf,
} from '@/lib/stock';

/** Thrown for expected, reportable failures so routes can map them to a status code. */
export class StockError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'StockError';
    this.status = status;
  }
}

export type AvailabilityResult = AvailabilityItem & Availability;

/**
 * Availability for a batch of units.
 *
 * ONE query for the whole batch, then matched in memory — a per-item query would be an N+1
 * on every cart check. Units with no row come back as `not_tracked`.
 */
export async function checkAvailability(items: AvailabilityItem[]): Promise<AvailabilityResult[]> {
  const productIds = [...new Set(items.map((i) => i.productId))];

  // Only PUBLISHED products can be sold; anything else is treated as unavailable regardless
  // of stock, so a draft or archived product can never be added to a cart.
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, status: true },
  });
  const sellable = new Set(products.filter((p) => p.status === 'PUBLISHED').map((p) => p.id));

  const rows = await prisma.stockLevel.findMany({
    where: { productId: { in: productIds } },
    select: {
      productId: true,
      variantId: true,
      colorId: true,
      quantity: true,
      reserved: true,
      lowStockThreshold: true,
    },
  });
  const byKey = new Map(rows.map((r) => [stockKeyOf(r), r]));

  return items.map((item) => {
    if (!sellable.has(item.productId)) {
      return {
        ...item,
        status: 'out_of_stock' as const,
        available: 0,
        canFulfil: false,
        tracked: true,
      };
    }
    const record: StockRecord = byKey.get(stockKeyOf(item)) ?? null;
    return { ...item, ...resolveAvailability(record, item.quantity) };
  });
}

/** Every stock row for one product — powers the admin editor and the product page. */
export async function getProductStock(productId: string) {
  return prisma.stockLevel.findMany({
    where: { productId },
    orderBy: [{ variantId: 'asc' }, { colorId: 'asc' }],
  });
}

/**
 * Set an absolute stock count for one unit (admin).
 *
 * Absolute, not a delta: two admins adjusting by ±5 concurrently would both read the same
 * starting figure and one increment would vanish. A stock count is authoritative.
 */
export async function setStock(input: SetStockInput) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true },
  });
  if (!product) throw new StockError('Product not found', 404);

  const { productId, variantId, colorId, quantity, lowStockThreshold } = input;
  return prisma.stockLevel.upsert({
    where: { productId_variantId_colorId: { productId, variantId, colorId } },
    create: { productId, variantId, colorId, quantity, lowStockThreshold },
    // `reserved` is deliberately untouched — it belongs to in-flight orders, not to the
    // admin's count of what is physically on the shelf.
    update: { quantity, lowStockThreshold },
  });
}

/**
 * Hold `quantity` units for a pending order.
 *
 * The guard lives in the WHERE clause so the check and the write are one atomic statement.
 * Reading availability and then updating would let two simultaneous checkouts both observe
 * the last unit and both succeed. Returns false when there was not enough left.
 */
export async function reserveStock(key: StockKey, quantity: number): Promise<boolean> {
  if (quantity <= 0) throw new StockError('Quantity must be at least 1');

  const updated = await prisma.$executeRaw`
    UPDATE "StockLevel"
    SET "reserved" = "reserved" + ${quantity}, "updatedAt" = NOW()
    WHERE "productId" = ${key.productId}::uuid
      AND "variantId" = ${key.variantId}
      AND "colorId" = ${key.colorId}
      AND "quantity" - "reserved" >= ${quantity}
  `;
  // 0 rows means either no stock row (untracked → allowed) or not enough left.
  if (updated > 0) return true;

  const exists = await prisma.stockLevel.findUnique({
    where: {
      productId_variantId_colorId: {
        productId: key.productId,
        variantId: key.variantId,
        colorId: key.colorId,
      },
    },
    select: { id: true },
  });
  return exists === null; // untracked units always succeed
}

/**
 * Release a previously held reservation (order cancelled or payment failed).
 *
 * `GREATEST(0, …)` so a repeated release cannot drive `reserved` negative, which would
 * silently inflate availability for everyone afterwards.
 */
export async function releaseStock(key: StockKey, quantity: number): Promise<void> {
  if (quantity <= 0) throw new StockError('Quantity must be at least 1');

  await prisma.$executeRaw`
    UPDATE "StockLevel"
    SET "reserved" = GREATEST(0, "reserved" - ${quantity}), "updatedAt" = NOW()
    WHERE "productId" = ${key.productId}::uuid
      AND "variantId" = ${key.variantId}
      AND "colorId" = ${key.colorId}
  `;
}

/**
 * Convert a reservation into a sale: the units leave the building.
 *
 * Both counters drop together, floored at zero so a duplicated fulfilment cannot produce
 * negative stock.
 */
export async function commitStock(key: StockKey, quantity: number): Promise<void> {
  if (quantity <= 0) throw new StockError('Quantity must be at least 1');

  await prisma.$executeRaw`
    UPDATE "StockLevel"
    SET "quantity" = GREATEST(0, "quantity" - ${quantity}),
        "reserved" = GREATEST(0, "reserved" - ${quantity}),
        "updatedAt" = NOW()
    WHERE "productId" = ${key.productId}::uuid
      AND "variantId" = ${key.variantId}
      AND "colorId" = ${key.colorId}
  `;
}
