import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/admin-guard";
import type { AddItemInput, CartSelection } from "@/lib/validations/cart";

/* ───────────────────────── Config ───────────────────────── */

const FREE_SHIPPING_THRESHOLD = 150;
const SHIPPING_FEE = 15;
const TAX_RATE = 0; // Qatar has no default sales tax.
const MAX_QTY = 99;

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

export interface CartLine {
  id: string;
  productId: string | null;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: CartProduct;
  variant: CartVariant;
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

function pickVariant(variants: any[], item: { variantId?: string | null; selection?: CartSelection | null }): any | undefined {
  if (!variants?.length) return undefined;
  return (
    (item.variantId && variants.find((v) => v.id === item.variantId)) ||
    (item.selection?.boxShape && variants.find((v) => v.variantName === item.selection!.boxShape)) ||
    variants.find((v) => v.isDefault) ||
    variants[0]
  );
}

function pickColor(variant: any, item: { colorId?: string | null; selection?: CartSelection | null }): any | undefined {
  const colors: any[] = variant?.colorVariants || [];
  if (!colors.length) return undefined;
  return (
    (item.colorId && colors.find((c) => c.id === item.colorId)) ||
    (item.selection?.roseColor && colors.find((c) => c.colorName === item.selection!.roseColor)) ||
    colors.find((c) => c.isDefault) ||
    colors[0]
  );
}

function colorImage(color: any): string | null {
  const gallery: any[] = color?.galleryImages || [];
  const primary = gallery.find((g) => g?.isPrimary) || gallery[0];
  return primary?.url || color?.swatchImage || color?.hoverImage || null;
}

/** Resolves the DB price for a catalog selection (salePrice preferred). */
function resolvePrice(product: any, item: { variantId?: string | null; colorId?: string | null; selection?: CartSelection | null }): number | null {
  const variant = pickVariant(product?.variants || [], item);
  const color = pickColor(variant, item);
  if (!color) return null;
  const sale = color.salePrice != null ? Number(color.salePrice) : null;
  const base = Number(color.price);
  return sale != null && sale < base ? sale : base;
}

/* ───────────────────── User.cart read / write ───────────────────── */

async function readCart(userId: string): Promise<StoredItem[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { cart: true } });
  if (!user) throw new CartError("User not found", 404);
  return normalize(user.cart);
}

async function writeCart(userId: string, items: StoredItem[]): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { cart: items as any } });
}

/** Accepts both the new ref shape and the legacy pipe-string + meta shape. */
function normalize(raw: unknown): StoredItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i) => i && typeof i === "object")
    .map((i: any): StoredItem => {
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

/* ───────────────────── Resolve (JOIN) + serialize ───────────────────── */

function computeSummary(lines: CartLine[]): CartSummary {
  const subtotal = round2(lines.reduce((s, l) => s + l.subtotal, 0));
  const discount = 0; // Coupons are applied at checkout.
  const taxable = Math.max(0, subtotal - discount);
  const tax = round2(taxable * TAX_RATE);
  const shipping = subtotal <= 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = round2(taxable + tax + shipping);
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  return { subtotal, discount, shipping, tax, total, itemCount };
}

function resolveLine(item: StoredItem, product: any | undefined): CartLine {
  if (item.productId && product) {
    const variant = pickVariant(product.variants || [], item);
    const color = pickColor(variant, item);
    const price = resolvePrice(product, item) ?? item.unitPrice; // always latest DB price
    return {
      id: item.id,
      productId: product.id,
      variantId: color?.id ?? variant?.id ?? item.variantId ?? null,
      quantity: item.quantity,
      unitPrice: price,
      subtotal: round2(price * item.quantity),
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
  return {
    id: item.id,
    productId: item.productId ?? null,
    variantId: item.variantId ?? null,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: round2(item.unitPrice * item.quantity),
    product: { id: item.productId ?? null, name: sel.name || "Custom Arrangement", slug: sel.slug || "", image: sel.image || null },
    variant: { id: null, roseColor: sel.roseColor ?? null, boxColor: sel.boxColor ?? null, boxShape: sel.boxShape ?? null },
  };
}

async function resolveCart(userId: string): Promise<CartPayload> {
  const items = await readCart(userId);
  const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean) as string[])];
  const products = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true, variants: true } })
    : [];
  const map = new Map(products.map((p) => [p.id, p]));
  const lines = items.map((i) => resolveLine(i, i.productId ? map.get(i.productId) : undefined));
  return { items: lines, summary: computeSummary(lines) };
}

/* ───────────────────── Auth ───────────────────── */

export async function resolveActiveUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new CartError("Please sign in to use your cart.", 401);
  return user.id;
}

/** Non-throwing variant: the current user's id, or null for guests. */
export async function getActiveUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/** A well-formed empty cart — returned for guests so reads never 401. */
export function emptyCart(): CartPayload {
  return { items: [], summary: computeSummary([]) };
}

/* ───────────────────── Operations ───────────────────── */

const dedupKey = (i: { productId: string | null; variantId: string | null; colorId: string | null; selection: CartSelection | null }) =>
  `${i.productId || "custom"}|${i.variantId || ""}|${i.colorId || ""}|${
    i.selection ? [i.selection.roseColor, i.selection.boxColor, i.selection.boxShape, i.selection.size, i.selection.lid, i.selection.card].map((v) => v || "").join("~") : ""
  }`;

export async function getCartPayload(userId: string): Promise<CartPayload> {
  return resolveCart(userId);
}

export async function addItem(userId: string, dto: AddItemInput): Promise<CartPayload> {
  let unitPrice = dto.unitPrice;

  // Validate the product and re-derive the authoritative price from the DB (never trust the client price).
  if (dto.productId) {
    const product = await prisma.product.findUnique({ where: { id: dto.productId }, select: { id: true, variants: true } });
    if (!product) throw new CartError("Product not found", 404);
    const dbPrice = resolvePrice(product, dto);
    if (dbPrice != null) unitPrice = dbPrice;
    // Note: no stock validation — the single-table Product model has no stock field.
  }

  const items = await readCart(userId);
  const incoming: StoredItem = {
    id: randomUUID(),
    productId: dto.productId ?? null,
    variantId: dto.variantId ?? null,
    colorId: dto.colorId ?? null,
    quantity: Math.min(MAX_QTY, dto.quantity),
    unitPrice,
    selection: dto.selection ?? null,
  };
  const idx = items.findIndex((i) => dedupKey(i) === dedupKey(incoming));
  if (idx > -1) items[idx].quantity = Math.min(MAX_QTY, items[idx].quantity + dto.quantity);
  else items.push(incoming);

  await writeCart(userId, items);
  return resolveCart(userId);
}

export async function updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartPayload> {
  let items = await readCart(userId);
  const item = items.find((i) => i.id === itemId);
  if (!item) throw new CartError("Cart item not found", 404);
  if (quantity <= 0) items = items.filter((i) => i.id !== itemId);
  else item.quantity = Math.min(MAX_QTY, quantity);
  await writeCart(userId, items);
  return resolveCart(userId);
}

export async function removeItem(userId: string, itemId: string): Promise<CartPayload> {
  const items = await readCart(userId);
  if (!items.some((i) => i.id === itemId)) throw new CartError("Cart item not found", 404);
  await writeCart(userId, items.filter((i) => i.id !== itemId));
  return resolveCart(userId);
}

export async function clearCart(userId: string): Promise<CartPayload> {
  await writeCart(userId, []);
  return resolveCart(userId);
}
