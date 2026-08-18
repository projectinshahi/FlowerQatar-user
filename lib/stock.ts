import { z } from 'zod';

/**
 * Stock availability rules and request schemas.
 *
 * Deliberately free of Prisma and of `next/server` so the rules can be unit-tested directly
 * (see tests/stock.test.ts). Everything that touches the database lives in
 * lib/services/stock.ts.
 */

/** The identity of one sellable unit: a colour variant inside a product. */
export type StockKey = {
  productId: string;
  variantId: string;
  colorId: string;
};

/** A persisted stock row, or null when the unit has no row (= not tracked). */
export type StockRecord = {
  quantity: number;
  reserved: number;
  lowStockThreshold: number;
} | null;

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'not_tracked';

export type Availability = {
  status: StockStatus;
  /** Units a customer can actually buy right now. `null` when the unit is not tracked. */
  available: number | null;
  /** Whether the requested quantity can be fulfilled. */
  canFulfil: boolean;
  /** True when no stock row exists, so the unit sells without limit. */
  tracked: boolean;
};

/** Hard ceiling on a single line, mirroring the cart's own per-line cap. */
export const MAX_QUANTITY = 99;

/** Batch cap: a checkout has a handful of lines, and this bounds the query cost. */
export const MAX_BATCH_ITEMS = 50;

/**
 * Sellable units. Never negative: `reserved` can legitimately exceed `quantity` if stock is
 * written down while orders are pending, and a negative "available" would then read as a
 * credit and let items through.
 */
export function availableUnits(record: NonNullable<StockRecord>): number {
  return Math.max(0, record.quantity - record.reserved);
}

/**
 * Resolve availability for one unit against a requested quantity.
 *
 * A unit with no row is NOT out of stock — it is untracked, and sells freely. Treating a
 * missing row as zero would take the entire catalogue offline the moment this table shipped,
 * since nothing has stock rows yet.
 */
export function resolveAvailability(record: StockRecord, requested: number): Availability {
  if (record === null) {
    return { status: 'not_tracked', available: null, canFulfil: true, tracked: false };
  }

  const available = availableUnits(record);
  const canFulfil = requested <= available;

  let status: StockStatus;
  if (available <= 0) status = 'out_of_stock';
  else if (available <= record.lowStockThreshold) status = 'low_stock';
  else status = 'in_stock';

  return { status, available, canFulfil, tracked: true };
}

/**
 * Can `quantity` be reserved against this row?
 *
 * The real guarantee is the guarded UPDATE in the service layer — two checkouts can both pass
 * this check and only one can win the write. This exists to reject impossible requests early
 * with a useful message.
 */
export function canReserve(record: StockRecord, quantity: number): boolean {
  if (quantity <= 0) return false;
  if (record === null) return true; // untracked
  return quantity <= availableUnits(record);
}

/**
 * Releasing never drives `reserved` below zero. A double-release (cancel processed twice, a
 * retried webhook) would otherwise leave a negative reservation that silently inflates
 * availability for every later shopper.
 */
export function releasedReserved(currentReserved: number, quantity: number): number {
  return Math.max(0, currentReserved - quantity);
}

/* ─────────────────────────── Request schemas ─────────────────────────── */

const uuid = z.string().uuid('Must be a valid product id');
/** Variant/colour ids come from the variants JSON — non-empty strings, not necessarily UUIDs. */
const jsonId = z.string().trim().min(1, 'Required').max(100);

export const stockKeySchema = z.object({
  productId: uuid,
  variantId: jsonId,
  colorId: jsonId,
});

export const availabilityItemSchema = stockKeySchema.extend({
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(MAX_QUANTITY, `Quantity must be at most ${MAX_QUANTITY}`)
    .default(1),
});

export const availabilityRequestSchema = z.object({
  items: z
    .array(availabilityItemSchema)
    .min(1, 'At least one item is required')
    .max(MAX_BATCH_ITEMS, `At most ${MAX_BATCH_ITEMS} items per request`),
});

/** Admin write. `quantity` is absolute (a stock count), never a delta — deltas lose races. */
export const setStockSchema = stockKeySchema.extend({
  quantity: z
    .number({ message: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .max(1_000_000, 'Quantity is unrealistically large'),
  lowStockThreshold: z
    .number()
    .int('Threshold must be a whole number')
    .min(0, 'Threshold cannot be negative')
    .max(1_000_000)
    .default(0),
});

export type AvailabilityRequest = z.infer<typeof availabilityRequestSchema>;
export type AvailabilityItem = z.infer<typeof availabilityItemSchema>;
export type SetStockInput = z.infer<typeof setStockSchema>;

/** Stable map key for matching request items to fetched rows without an N+1 query. */
export const stockKeyOf = (k: StockKey) => `${k.productId}|${k.variantId}|${k.colorId}`;
