import { prisma } from "@/lib/prisma";
import { getCartPayload } from "@/lib/services/cart";
import { validateCoupon } from "@/lib/services/marketing";
import { redeemPoints, refundPoints } from "@/lib/services/wallet";
import { getActiveMembership } from "@/lib/services/membership";

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export interface ShippingInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
}

export interface PlaceOrderInput {
  shippingMethod?: "standard" | "courier";
  couponCode?: string | null;
  pointsRedeemed?: number;
  shippingInfo?: ShippingInfo;
}

export interface PlacedOrder {
  orderId: string;
  reference: string;
  totalAmount: number;
  pointsRedeemed: number;
}

/**
 * Place an order for the authenticated user. Reads the user's SERVER cart (authoritative
 * prices — the client is never trusted), re-derives totals (shipping/tax/coupon matching the
 * checkout), then in ONE transaction creates the Order + OrderItems, atomically redeems any
 * points, and clears the cart. The order then appears in the admin panel.
 */
export async function placeOrder(userId: string, input: PlaceOrderInput): Promise<PlacedOrder> {
  const cart = await getCartPayload(userId);
  if (cart.items.length === 0) throw new OrderError("Your cart is empty");

  const subtotal = round2(cart.summary.subtotal);
  // Only real products become order line items (OrderItem.productId is required).
  const lineItems = cart.items.filter((i) => i.productId);

  // Coupon — re-validated server-side; ignored if no longer valid (order still proceeds).
  let couponDiscount = 0;
  let freeDelivery = false;
  if (input.couponCode) {
    const couponItems = lineItems.map((i) => ({
      productId: i.productId as string,
      quantity: i.quantity,
      price: i.unitPrice,
    }));
    const result = await validateCoupon(input.couponCode, couponItems, userId);
    if (result.valid) {
      couponDiscount = result.discount;
      freeDelivery = result.freeDelivery;
    }
  }

  // Shipping + tax — same formulas the checkout displays.
  const baseShipping = subtotal >= 150 ? 0 : 15;
  const shippingFee = baseShipping + (input.shippingMethod === "courier" ? 35 : 0);
  const effectiveShipping = freeDelivery ? 0 : shippingFee;
  const tax = Math.round(subtotal * 0.08);
  const total = Math.max(0, round2(subtotal + effectiveShipping + tax - couponDiscount));

  const pointsRequested = Math.max(0, Math.floor(input.pointsRedeemed ?? 0));
  const grandTotal = Math.max(0, round2(total - pointsRequested));

  // How the customer paid.
  const paymentMethod = pointsRequested <= 0 ? "CARD" : pointsRequested >= total ? "POINTS" : "MIXED";

  // Redeeming requires an active membership (checked before the transaction).
  if (pointsRequested > 0) {
    const membership = await getActiveMembership(userId);
    if (!membership) throw new OrderError("An active membership is required to redeem points");
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        totalAmount: grandTotal,
        subtotal,
        shippingFee: effectiveShipping,
        tax,
        discount: couponDiscount,
        pointsRedeemed: pointsRequested,
        paymentMethod,
        shippingInfo: (input.shippingInfo ?? {}) as object,
        status: "PENDING",
        items: {
          create: lineItems.map((i) => ({
            productId: i.productId as string,
            variantSku: i.variant?.boxShape ?? null,
            colorName: i.variant?.roseColor ?? null,
            quantity: i.quantity,
            price: i.unitPrice,
          })),
        },
      },
    });

    // Deduct points atomically against this order (double-spend safe, ledgered).
    if (pointsRequested > 0) {
      await redeemPoints(userId, pointsRequested, total, { reason: "Redeemed at checkout", reference: created.id }, tx);
    }

    // Empty the cart so the same items can't be re-ordered.
    await tx.user.update({ where: { id: userId }, data: { cart: [] } });

    return created;
  });

  return {
    orderId: order.id,
    reference: order.id.slice(0, 8).toUpperCase(),
    totalAmount: grandTotal,
    pointsRedeemed: pointsRequested,
  };
}

// Only pre-shipment orders can be cancelled; after that it's in transit/settled.
const CANCELLABLE = new Set(["PENDING", "PROCESSING"]);

/**
 * Cancel an order and refund any redeemed points to the wallet — in ONE transaction.
 * Shared by the customer cancel endpoint and the admin status→CANCELLED path, so points are
 * never silently burned regardless of who cancels. Pass `userId` (customer path) to enforce
 * ownership; omit it for admin.
 */
export async function cancelOrder(
  orderId: string,
  opts: { userId?: string; reason?: string } = {}
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true, pointsRedeemed: true },
  });
  if (!order) throw new OrderError("Order not found", 404);
  if (opts.userId && order.userId !== opts.userId) throw new OrderError("Order not found", 404);
  if (order.status === "CANCELLED") return; // idempotent — already cancelled, don't double-refund
  if (!CANCELLABLE.has(order.status)) {
    throw new OrderError(`A ${order.status.toLowerCase()} order can no longer be cancelled`);
  }

  await prisma.$transaction(async (tx) => {
    // Conditional update guards against a concurrent cancel double-refunding the same points.
    const res = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["PENDING", "PROCESSING"] } },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: opts.reason ?? null },
    });
    if (res.count !== 1) throw new OrderError("Order can no longer be cancelled", 409);

    if (order.pointsRedeemed > 0) {
      await refundPoints(order.userId, order.pointsRedeemed, { reason: "Order cancelled", reference: orderId }, tx);
    }
  });
}
