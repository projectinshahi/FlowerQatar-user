import { prisma } from "@/lib/prisma";
import { getCartPayload, loadShippingConfig, TAX_RATE } from "@/lib/services/cart";
import { calculateShippingForMethod } from "@/lib/shipping";
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
  const pointsRequested = Math.max(0, Math.floor(input.pointsRedeemed ?? 0));

  /*
   * Independent reads, issued together: the priced cart, the admin's shipping configuration,
   * and — only when points are being redeemed — the membership. Each used to be awaited in
   * turn, on the path where a customer is waiting to see their order confirmed. The checks
   * below still run in their original order, so the error a customer sees is unchanged.
   */
  const [cart, shippingConfig, membership] = await Promise.all([
    getCartPayload(userId),
    loadShippingConfig(),
    pointsRequested > 0 ? getActiveMembership(userId) : null,
  ]);
  if (cart.items.length === 0) throw new OrderError("Your cart is empty");

  const subtotal = round2(cart.summary.subtotal);
  // Only real products become order line items (OrderItem.productId is required).
  const lineItems = cart.items.filter((i) => i.productId);

  /*
   * A product can be deleted or unpublished by an admin AFTER it went into the cart. The cart
   * still prices such a line from its stored selection, so without this check the order was
   * placed anyway (an unpublished product sold, or a foreign-key failure for a deleted one).
   * The live notice on the product page is only a courtesy; this is the enforcement.
   */
  const productIds = [...new Set(lineItems.map((i) => i.productId as string))];
  if (productIds.length) {
    const available = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "PUBLISHED" },
      select: { id: true },
    });
    const ok = new Set(available.map((p) => p.id));
    const gone = lineItems.find((i) => !ok.has(i.productId as string));
    if (gone) {
      throw new OrderError(
        `"${gone.product.name}" is no longer available. Please remove it from your cart to continue.`,
        409
      );
    }
  }

  // Coupon — re-validated server-side; ignored if no longer valid (order still proceeds).
  let couponDiscount = 0;
  let freeDelivery = false;
  let couponId: string | null = null;
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
      couponId = result.couponId;
    }
  }

  /*
   * Shipping comes from the admin's DeliveryCharge row — the same source the cart and checkout
   * read. This used to be `subtotal >= 150 ? 0 : 15` with a hardcoded 35 courier surcharge, so
   * switching delivery off in the admin changed the displayed cart but the customer was still
   * billed QAR 15 on the order that was actually created.
   */
  const shippingFee = calculateShippingForMethod(subtotal, shippingConfig, input.shippingMethod);
  const effectiveShipping = freeDelivery ? 0 : shippingFee;
  /*
   * Same rate as the cart (TAX_RATE, 0 in Qatar). This used to add a hardcoded 8% that the
   * checkout never displayed, so stored orders and invoices totalled more than the customer saw.
   */
  const tax = round2(subtotal * TAX_RATE);
  const total = Math.max(0, round2(subtotal + effectiveShipping + tax - couponDiscount));

  const grandTotal = Math.max(0, round2(total - pointsRequested));

  // How the customer paid.
  const paymentMethod = pointsRequested <= 0 ? "CARD" : pointsRequested >= total ? "POINTS" : "MIXED";

  // Redeeming requires an active membership (checked before the transaction).
  if (pointsRequested > 0 && !membership) {
    throw new OrderError("An active membership is required to redeem points");
  }

  const order = await prisma.$transaction(async (tx) => {
    /*
     * Serialise concurrent checkouts for this user: lock the user row, then confirm the cart
     * still holds items. A second request (double-submit, retry, another tab) waits here until
     * the first commits; by then the cart is empty, so it stops instead of creating a duplicate.
     */
    const [locked] = await tx.$queryRaw<{ cart: unknown }[]>`
      SELECT "cart" FROM "User" WHERE "id" = ${userId}::uuid FOR UPDATE`;
    if (!Array.isArray(locked?.cart) || locked.cart.length === 0) {
      throw new OrderError("This order has already been placed.", 409);
    }

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

    /*
     * Record the coupon use against this order, atomically. validateCoupon above is read-only,
     * so usage limits (global and per-customer) were never enforced: a single-use coupon worked
     * on every order. Same steps as applyCoupon, inside this transaction so a failure here rolls
     * the order back rather than leaving an order with an unrecorded discount.
     */
    if (couponId) {
      const coupon = await tx.coupon.findUnique({
        where: { id: couponId },
        select: { usageLimit: true, usagePerCustomer: true },
      });
      const bumped = await tx.coupon.updateMany({
        where:
          coupon?.usageLimit == null
            ? { id: couponId }
            : { id: couponId, currentUsage: { lt: coupon.usageLimit } },
        data: { currentUsage: { increment: 1 } },
      });
      if (bumped.count === 0) {
        throw new OrderError("This coupon has just reached its usage limit. Please remove it and try again.", 409);
      }
      if (coupon?.usagePerCustomer != null) {
        const used = await tx.couponUsage.count({ where: { couponId, userId } });
        if (used >= coupon.usagePerCustomer) {
          throw new OrderError("You have already used this coupon.", 409);
        }
      }
      await tx.couponUsage.create({
        data: { couponId, userId, orderId: created.id, discount: couponDiscount },
      });
    }

    // Deduct points atomically against this order (double-spend safe, ledgered).
    if (pointsRequested > 0) {
      await redeemPoints(userId, pointsRequested, total, { reason: "Redeemed at checkout", reference: created.id }, tx);
    }

    // Empty the cart so the same items can't be re-ordered.
    await tx.user.update({ where: { id: userId }, data: { cart: [] } });

    return created;
  }, {
    /*
     * A concurrent checkout for the same user waits on the row lock above for the whole of the
     * first transaction. Prisma's 5s default counted that wait as its own runtime, so on a slow
     * link the WAITING request failed with a 500 instead of the clean "already placed" 409.
     */
    maxWait: 10_000,
    timeout: 20_000,
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
