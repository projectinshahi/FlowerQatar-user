import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { ACTIVE_USER, getCurrentUser } from "@/lib/admin-guard";
import { getCustomerSessionUserId } from "@/lib/customer-guard";
import { MAX_CART_QUANTITY } from "@/lib/cart-limits";
import type { AddItemInput, CartSelection } from "@/lib/validations/cart";
import type { Prisma } from "@prisma/client";
import type { ProductColorVariant, ProductVariant } from "@/types/product-detail";
import { unstable_cache } from "next/cache";
import { NO_SHIPPING, calculateShipping, type ShippingConfig } from "@/lib/shipping";
import { logDbError } from "@/lib/prisma-error";
import { resolveExtraPrices } from "@/lib/gifts";

/* ───────────────────────── Config ───────────────────────── */

// Shipping is NOT configured here any more — it comes from the admin's DeliveryCharge row
// (see loadShippingConfig below). The old hardcoded 15 fee / 150 threshold meant the admin
// screen had no effect on what customers were actually charged.
/** Qatar has no default sales tax. Shared with order placement so cart and order agree. */
export const TAX_RATE = 0;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export class CartError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "CartError";
    this.status = status;
  }
}

/* ───────────────────────── Types ───────────────────────── */

/** Reference-only item persisted in User.cart JSON (no duplicated product data). */
interface StoredItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  colorId: string | null;
  quantity: number;
  unitPrice: number;
  selection: CartSelection | null; // fallback/display for id-less or custom items
}

/** A User.cart entry as read back: the current shape above, or the legacy pipe-string + meta one. */
interface RawStoredItem {
  id?: unknown;
  productId?: string | null;
  variantId?: string | null;
  colorId?: string | null;
  quantity?: unknown;
  unitPrice?: unknown;
  selection?: unknown;
  variant?: unknown;
  meta?: Partial<Record<"roseColor" | "boxColor" | "boxShape" | "name" | "slug" | "image", string>>;
}

export interface CartProduct {
  id: string | null;
  name: string;
  slug: string;
  image: string | null;
}

export interface CartVariant {
  id: string | null;
  roseColor: string | null;
  boxColor: string | null;
  boxShape: string | null;
}

/** An optional gift / add-on attached to a line, priced from the database. */
export interface CartExtra {
  id: string;
  name: string;
  price: number;
}

export interface CartLine {
  id: string;
  productId: string | null;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: CartProduct;
  variant: CartVariant;
  /** Optional gifts on this line, with DB prices. Already included in unitPrice. */
  addOns: CartExtra[];
}

export interface CartSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
}

export interface CartPayload {
  items: CartLine[];
  summary: CartSummary;
}

/* ───────────────────── JSON variant resolution ───────────────────── */

/** Product.variants is a JSON column; anything that is not an array has no variants. */
const variantsOf = (product: { variants: Prisma.JsonValue }) =>
  (Array.isArray(product.variants) ? product.variants : []) as unknown as ProductVariant[];

function pickVariant(variants: ProductVariant[], item: { variantId?: string | null; selection?: CartSelection | null }): ProductVariant | undefined {
  if (!variants?.length) return undefined;
  return (
    (item.variantId && variants.find((v) => v.id === item.variantId)) ||
    (item.selection?.boxShape && variants.find((v) => v.variantName === item.selection!.boxShape)) ||
    variants.find((v) => v.isDefault) ||
    variants[0]
  );
}

function pickColor(variant: ProductVariant | undefined, item: { colorId?: string | null; selection?: CartSelection | null }): ProductColorVariant | undefined {
  const colors = variant?.colorVariants || [];
  if (!colors.length) return undefined;
  return (
    (item.colorId && colors.find((c) => c.id === item.colorId)) ||
    (item.selection?.roseColor && colors.find((c) => c.colorName === item.selection!.roseColor)) ||
    colors.find((c) => c.isDefault) ||
    colors[0]
  );
}

function colorImage(color: ProductColorVariant | undefined): string | null {
  // The colour's main media is its Color Swatch upload; gallery and hover media are fallbacks.
  const gallery = color?.galleryImages || [];
  const primary = gallery.find((g) => g?.isPrimary) || gallery[0];
  return color?.swatchImage || primary?.url || color?.hoverImage || null;
}

/** Resolves the DB price for a catalog selection (salePrice preferred). */
function resolvePrice(product: { variants: Prisma.JsonValue }, item: { variantId?: string | null; colorId?: string | null; selection?: CartSelection | null }): number | null {
  const variant = pickVariant(variantsOf(product), item);
  const color = pickColor(variant, item);
  if (!color) return null;
  const sale = color.salePrice != null ? Number(color.salePrice) : null;
  const base = Number(color.price);
  return sale != null && sale < base ? sale : base;
}

/* ───────────────────── User.cart read / write ───────────────────── */

/** Doubles as the auth check: an inactive, blocked or deleted account reads as signed out. */
async function readCart(userId: string): Promise<StoredItem[]> {
  const user = await prisma.user.findFirst({ where: { id: userId, ...ACTIVE_USER }, select: { cart: true } });
  if (!user) throw new CartError("Please sign in to use your cart.", 401);
  return normalize(user.cart);
}

async function writeCart(userId: string, items: StoredItem[]): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { cart: items as unknown as Prisma.InputJsonValue } });
}

/** Accepts both the new ref shape and the legacy pipe-string + meta shape. */
function normalize(raw: unknown): StoredItem[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawStoredItem[])
    .filter((i) => i && typeof i === "object")
    .map((i): StoredItem => {
      const legacy = typeof i.variant === "string"; // old pipe-string items had a `meta` block
      if (legacy) {
        const meta = i.meta || {};
        return {
          id: String(i.id ?? randomUUID()),
          productId: i.productId ?? null,
          variantId: null,
          colorId: null,
          quantity: Math.max(0, Number(i.quantity) || 0),
          unitPrice: Number(i.unitPrice) || 0,
          selection: {
            roseColor: meta.roseColor,
            boxColor: meta.boxColor,
            boxShape: meta.boxShape,
            name: meta.name,
            slug: meta.slug,
            image: meta.image,
          },
        };
      }
      return {
        id: String(i.id ?? randomUUID()),
        productId: i.productId ?? null,
        variantId: i.variantId ?? null,
        colorId: i.colorId ?? null,
        quantity: Math.max(0, Number(i.quantity) || 0),
        unitPrice: Number(i.unitPrice) || 0,
        selection: (i.selection as CartSelection) ?? null,
      };
    });
}

/* ───────────────────── Optional gifts / add-ons ───────────────────── */

/**
 * The greeting fields a line may keep.
 *
 * The greeting card is a Blushing Blooms option: only that product page offers one, so a
 * greeting arriving for any other product came from a hand-made request or a cart line built
 * before the product changed category. Those fields are dropped rather than rejected, which
 * is how an unknown gift id is already handled, and means a stale client can never block an
 * otherwise valid add to cart.
 *
 * A custom arrangement (no productId, so no categoryType) keeps whatever it sent: /custom has
 * its own card field and is not a catalogue product.
 */
export function greetingFieldsFor<T extends Record<string, unknown>>(
  selection: T,
  categoryType: string | null | undefined,
  isCatalogueProduct: boolean
): T {
  if (!isCatalogueProduct || categoryType === "BLUSHING_BLOOMS") return selection;
  const rest = { ...selection };
  delete rest.greetingTemplateId;
  delete rest.greetingMessage;
  delete rest.greetingStyle;
  return rest;
}

/** Sorted extra ids on a line — the identity of a gift selection. */
export function extraIds(selection: CartSelection | null | undefined): string[] {
  return (selection?.addOns || [])
    .map((a) => a?.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .sort();
}

/**
 * Prices a line's extras from the database.
 *
 * The client sends { id, name, price } for display, but the price it sends is never used:
 * only ids are looked up, so a tampered payload cannot discount a gift. Ids that no longer
 * exist (or were deactivated) drop out and are charged nothing.
 */
export function priceExtras(
  selection: CartSelection | null | undefined,
  prices: Map<string, { name: string; price: number }>
): { list: CartExtra[]; total: number } {
  const list: CartExtra[] = [];
  for (const id of extraIds(selection)) {
    const row = prices.get(id);
    if (row) list.push({ id, name: row.name, price: row.price });
  }
  return { list, total: round2(list.reduce((sum, a) => sum + a.price, 0)) };
}

/* ───────────────────── Resolve (JOIN) + serialize ───────────────────── */

/**
 * The admin's shipping configuration.
 *
 * Falls back to "no shipping" when the row is missing or the database is unreachable —
 * inventing a charge nobody configured would bill customers for something that was never
 * set up, and failing the whole cart over a config read would be worse still.
 */
export async function loadShippingConfig(): Promise<ShippingConfig> {
  try {
    return await readShippingConfig();
  } catch (error) {
    logDbError("loadShippingConfig", error);
    return NO_SHIPPING;
  }
}

/**
 * The read itself, which throws.
 *
 * Split out so the cached variant below wraps this and not the fallback: unstable_cache stores
 * whatever its function returns, so caching the catch above would pin "delivery is off" in
 * place for an hour after one unreachable moment — every shopper in that hour quoted free
 * delivery on a store that charges for it. A thrown result is never stored, so the next request
 * simply tries again.
 */
async function readShippingConfig(): Promise<ShippingConfig> {
  const row = await prisma.deliveryCharge.findFirst({
    select: { isActive: true, chargeType: true, value: true, freeAbove: true },
  });
  if (!row) return NO_SHIPPING;
  return {
    isActive: row.isActive,
    chargeType: row.chargeType as ShippingConfig["chargeType"],
    value: Number(row.value),
    freeAbove: Number(row.freeAbove),
  };
}

export const DELIVERY_CONFIG_TAG = "delivery-config";

/**
 * The same row, for the public quote endpoint only.
 *
 * /api/shipping is a lone request with nothing to overlap — measured at 1.45s, a full round
 * trip to the database in us-east-1 — and the cart and checkout pages both block their
 * delivery line on it. Everywhere else this row is read it is already inside a Promise.all
 * beside other queries, so it costs nothing extra and stays a live read.
 *
 * Deliberately NOT used by order placement: what a customer is actually charged is still read
 * fresh, in lib/services/order.ts, so no cache can sit between the admin's fee and the money.
 *
 * Staleness is covered twice over. The admin's save calls publishChange('delivery.updated'),
 * which purges this tag with expire: 0 before the response is even sent; the same event also
 * reaches every open cart and checkout over Socket.IO, and both already re-read on it. The
 * hour is only a backstop for a process that somehow missed the write.
 */
const loadCachedShippingConfig = unstable_cache(readShippingConfig, ["delivery-config-v1"], {
  tags: [DELIVERY_CONFIG_TAG],
  revalidate: 3600,
});

export async function getShippingQuoteConfig(): Promise<ShippingConfig> {
  try {
    return await loadCachedShippingConfig();
  } catch (error) {
    logDbError("getShippingQuoteConfig", error);
    return NO_SHIPPING;
  }
}

function computeSummary(lines: CartLine[], shippingConfig: ShippingConfig): CartSummary {
  const subtotal = round2(lines.reduce((s, l) => s + l.subtotal, 0));
  const discount = 0; // Coupons are applied at checkout.
  const taxable = Math.max(0, subtotal - discount);
  const tax = round2(taxable * TAX_RATE);
  const shipping = calculateShipping(subtotal, shippingConfig);
  const total = round2(taxable + tax + shipping);
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  return { subtotal, discount, shipping, tax, total, itemCount };
}

function resolveLine(
  item: StoredItem,
  product: { id: string; name: string; slug: string; variants: Prisma.JsonValue } | undefined,
  prices: Map<string, { name: string; price: number }>
): CartLine {
  const extras = priceExtras(item.selection, prices);
  if (item.productId && product) {
    const variant = pickVariant(variantsOf(product), item);
    const color = pickColor(variant, item);
    // Latest DB price for the product, plus the DB price of every gift on this line.
    const price = round2((resolvePrice(product, item) ?? item.unitPrice) + extras.total);
    return {
      id: item.id,
      productId: product.id,
      variantId: color?.id ?? variant?.id ?? item.variantId ?? null,
      quantity: item.quantity,
      unitPrice: price,
      subtotal: round2(price * item.quantity),
      addOns: extras.list,
      product: { id: product.id, name: product.name, slug: product.slug, image: colorImage(color) },
      variant: {
        id: color?.id ?? null,
        roseColor: color?.colorName ?? item.selection?.roseColor ?? null,
        boxColor: item.selection?.boxColor ?? "Standard",
        boxShape: variant?.variantName ?? item.selection?.boxShape ?? null,
      },
    };
  }

  // Custom arrangement or a product that no longer exists — fall back to the stored selection.
  const sel = item.selection || {};
  const fallbackPrice = round2(item.unitPrice + extras.total);
  return {
    id: item.id,
    productId: item.productId ?? null,
    variantId: item.variantId ?? null,
    quantity: item.quantity,
    unitPrice: fallbackPrice,
    subtotal: round2(fallbackPrice * item.quantity),
    addOns: extras.list,
    product: { id: item.productId ?? null, name: sel.name || "Custom Arrangement", slug: sel.slug || "", image: sel.image || null },
    variant: { id: null, roseColor: sel.roseColor ?? null, boxColor: sel.boxColor ?? null, boxShape: sel.boxShape ?? null },
  };
}

/*
 * Prices a known set of stored items into the payload the storefront renders.
 *
 * Separate from reading the cart so a write can price the items it already holds instead of
 * reading them back: every mutation used to write the cart and then call resolveCart(), which
 * re-read the same row and the same products it had just loaded. The three lookups here don't
 * depend on each other, so they run together — each is a round trip to a remote database.
 */
async function buildPayload(items: StoredItem[]): Promise<CartPayload> {
  const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean) as string[])];
  const [shippingConfig, products, prices] = await Promise.all([
    loadShippingConfig(),
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true, variants: true } })
      : [],
    // One lookup for every gift/add-on in the cart, rather than one per line.
    resolveExtraPrices(items.flatMap((i) => extraIds(i.selection))),
  ]);

  const map = new Map(products.map((p) => [p.id, p]));
  const lines = items.map((i) => resolveLine(i, i.productId ? map.get(i.productId) : undefined, prices));
  return { items: lines, summary: computeSummary(lines, shippingConfig) };
}

async function resolveCart(userId: string): Promise<CartPayload> {
  return buildPayload(await readCart(userId));
}

/**
 * Persists the cart and returns its priced payload in the same breath. The payload is built
 * from the very items being written, so nothing needs to be read back afterwards; if the write
 * fails, Promise.all rejects and the caller gets the error exactly as before.
 */
async function saveAndPrice(userId: string, items: StoredItem[]): Promise<CartPayload> {
  const [, payload] = await Promise.all([writeCart(userId, items), buildPayload(items)]);
  return payload;
}

/* ───────────────────── Auth ───────────────────── */

/**
 * The session's user id, without a database read. Only for operations that go on to call
 * readCart, which rejects inactive accounts — so the auth check and the cart load are one query.
 */
export async function resolveSessionUserId(): Promise<string> {
  const userId = await getCustomerSessionUserId();
  if (!userId) throw new CartError("Please sign in to use your cart.", 401);
  return userId;
}

/** The signed-in customer's cart, or an empty one for guests and inactive accounts. One read. */
export async function getSessionCart(): Promise<CartPayload> {
  const userId = await getCustomerSessionUserId();
  if (!userId) return emptyCart();
  try {
    return await getCartPayload(userId);
  } catch (e) {
    if (e instanceof CartError && e.status === 401) return emptyCart();
    throw e;
  }
}

/** Non-throwing variant: the current user's id, or null for guests. */
export async function getActiveUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/** A well-formed empty cart — returned for guests so reads never 401. */
export function emptyCart(): CartPayload {
  return { items: [], summary: computeSummary([], NO_SHIPPING) };
}

/* ───────────────────── Operations ───────────────────── */

const dedupKey = (i: { productId: string | null; variantId: string | null; colorId: string | null; selection: CartSelection | null }) =>
  `${i.productId || "custom"}|${i.variantId || ""}|${i.colorId || ""}|${
    i.selection ? [i.selection.roseColor, i.selection.boxColor, i.selection.boxShape, i.selection.size, i.selection.lid, i.selection.card].map((v) => v || "").join("~") : ""
  }|${extraIds(i.selection).join(",")}`;

export async function getCartPayload(userId: string): Promise<CartPayload> {
  return resolveCart(userId);
}

export async function addItem(userId: string, dto: AddItemInput): Promise<CartPayload> {
  /*
   * Three independent reads, issued together: the gift prices, the product being added, and
   * the user's current cart. None depends on the others, and each was previously awaited in
   * turn — three round trips before a single byte was written.
   */
  const [prices, product, items] = await Promise.all([
    // Scoped to the product, so only gifts its category actually offers can be priced.
    resolveExtraPrices(extraIds(dto.selection), dto.productId),
    dto.productId
      ? prisma.product.findUnique({
          where: { id: dto.productId },
          select: { id: true, variants: true, status: true, categoryType: true },
        })
      : null,
    readCart(userId),
  ]);

  const extras = priceExtras(dto.selection, prices);

  // The client sends base + gifts as one unitPrice; store the base alone so that reading the
  // cart (which adds the DB gift prices) can never count a gift twice.
  let unitPrice = Math.max(0, round2(dto.unitPrice - extras.total));

  // Validate the product and re-derive the authoritative price from the DB (never trust the client price).
  if (dto.productId) {
    // Draft or archived products are not for sale, even if their id is known.
    if (!product || product.status !== "PUBLISHED") throw new CartError("This product is not available", 404);
    const dbPrice = resolvePrice(product, dto);
    if (dbPrice != null) unitPrice = dbPrice;
    // Note: no stock validation — the single-table Product model has no stock field.
  }

  const incoming: StoredItem = {
    id: randomUUID(),
    productId: dto.productId ?? null,
    variantId: dto.variantId ?? null,
    colorId: dto.colorId ?? null,
    quantity: Math.min(MAX_CART_QUANTITY, dto.quantity),
    unitPrice,
    // Store the gifts with DB names/prices, so the saved cart never holds client figures,
    // and drop a greeting the product does not offer.
    selection: dto.selection
      ? greetingFieldsFor(
          { ...dto.selection, addOns: extras.list.length ? extras.list : undefined },
          product?.categoryType,
          Boolean(dto.productId)
        )
      : null,
  };
  const idx = items.findIndex((i) => dedupKey(i) === dedupKey(incoming));
  if (idx > -1) items[idx].quantity = Math.min(MAX_CART_QUANTITY, items[idx].quantity + dto.quantity);
  else items.push(incoming);

  return saveAndPrice(userId, items);
}

export async function updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartPayload> {
  let items = await readCart(userId);
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new CartError("Cart item not found", 404);
  if (quantity <= 0) items = items.filter((i) => i.id !== itemId);
  else item.quantity = Math.min(MAX_CART_QUANTITY, quantity);
  return saveAndPrice(userId, items);
}

export async function removeItem(userId: string, itemId: string): Promise<CartPayload> {
  const items = await readCart(userId);
  if (!items.some((i) => i.id === itemId)) throw new CartError("Cart item not found", 404);
  return saveAndPrice(userId, items.filter((i) => i.id !== itemId));
}

export async function clearCart(userId: string): Promise<CartPayload> {
  return saveAndPrice(userId, []);
}
