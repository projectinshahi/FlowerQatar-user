import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCartPayload, loadShippingConfig, TAX_RATE } from "@/lib/services/cart";
import { calculateShippingForMethod } from "@/lib/shipping";
import { validateCoupon } from "@/lib/services/marketing";
import { POINT_VALUE, getWalletView, redeemPoints, refundPoints } from "@/lib/services/wallet";
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
  /** True when there was nothing to pay, so the order is settled already (no gateway step). */
  paid: boolean;
}

/**
 * Create an order for the authenticated user, ready to be paid. Reads the user's SERVER cart
 * (authoritative prices — the client is never trusted), re-derives totals (shipping/tax/coupon
 * matching the checkout) and records the Order + OrderItems as UNPAID.
 *
 * NOTHING is spent here. The cart stays as it is, the points are not redeemed and the coupon is
 * not consumed, because the customer has not paid yet — they are about to be sent to the
 * gateway and may cancel, fail, or simply close the tab. All of that happens in one step, once,
 * in applyPaidEffects(), when the payment has been verified with the gateway.
 *
 * The one exception is an order with nothing to pay (points/discount cover it): there is no
 * gateway step, so it is settled inside this same transaction.
 */
export async function createPendingOrder(userId: string, input: PlaceOrderInput): Promise<PlacedOrder> {
  const pointsRequested = Math.max(0, Math.floor(input.pointsRedeemed ?? 0));

  /*
   * Independent reads, issued together: the priced cart, the admin's shipping configuration,
   * and — only when points are being redeemed — the membership. Each used to be awaited in
   * turn, on the path where a customer is waiting to see their order confirmed. The checks
   * below still run in their original order, so the error a customer sees is unchanged.
   */
  const [cart, shippingConfig, membership, wallet] = await Promise.all([
    getCartPayload(userId),
    loadShippingConfig(),
    pointsRequested > 0 ? getActiveMembership(userId) : null,
    pointsRequested > 0 ? getWalletView(userId) : null,
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
   *
   * Read alongside the coupon check, which is read-only and needs only the same cart lines.
   */
  const productIds = [...new Set(lineItems.map((i) => i.productId as string))];
  const couponItems = lineItems.map((i) => ({
    productId: i.productId as string,
    quantity: i.quantity,
    price: i.unitPrice,
  }));
  const [available, couponResult] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({ where: { id: { in: productIds }, status: "PUBLISHED" }, select: { id: true } })
      : [],
    input.couponCode ? validateCoupon(input.couponCode, couponItems, userId) : null,
  ]);
  const ok = new Set(available.map((p) => p.id));
  const gone = lineItems.find((i) => !ok.has(i.productId as string));
  if (gone) {
    throw new OrderError(
      `"${gone.product.name}" is no longer available. Please remove it from your cart to continue.`,
      409
    );
  }

  // Coupon — re-validated server-side; ignored if no longer valid (order still proceeds).
  let couponDiscount = 0;
  let freeDelivery = false;
  let couponId: string | null = null;
  if (couponResult?.valid) {
    couponDiscount = couponResult.discount;
    freeDelivery = couponResult.freeDelivery;
    couponId = couponResult.couponId;
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

  /*
   * Redeeming requires an active membership. The balance is checked here too: the points are
   * only actually deducted once the payment succeeds, so without this a customer could be sent
   * to the gateway with a discount their wallet cannot cover.
   */
  if (pointsRequested > 0) {
    if (!membership) throw new OrderError("An active membership is required to redeem points");
    if (pointsRequested > (wallet?.availablePoints ?? 0)) {
      throw new OrderError("You don't have enough points");
    }
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
      throw new OrderError("Your cart is empty");
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
        // Held, not spent: applied by applyPaidEffects() once the payment is verified.
        couponId,
        cartItemIds: cart.items.map((i) => i.id),
        paymentStatus: "UNPAID",
        paymentProvider: grandTotal > 0 ? "SKIPCASH" : "NONE",
        // The delivery method travels with the snapshot, so the confirmation screen can be
        // rebuilt from the order after the customer comes back from the payment gateway.
        shippingInfo: { ...(input.shippingInfo ?? {}), shippingMethod: input.shippingMethod ?? "standard" } as object,
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
     * Nothing payable — points and discounts covered the whole order. There is no gateway step
     * to wait for, so it is settled right here, in the same transaction that created it.
     */
    if (grandTotal <= 0) {
      await tx.order.update({
        where: { id: created.id },
        data: { paymentStatus: "PAID", paidAt: new Date() },
      });
      await applyPaidEffects(tx, created.id);
    }

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
    paid: grandTotal <= 0,
  };
}

/**
 * Everything that is spent when an order is paid, and only then: the coupon usage is recorded,
 * the points are redeemed, and the lines this order was built from leave the cart.
 *
 * Always called from inside the transaction that moved the order to PAID — that transition is
 * what makes it run exactly once, however many webhooks or return calls arrive.
 *
 * The money has already been taken by the time this runs, so a coupon that has just hit its
 * limit or a wallet that no longer holds the points does NOT fail the order: what the customer
 * paid for is honoured and the discrepancy is logged for the shop to look at.
 */
async function applyPaidEffects(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: {
      userId: true,
      couponId: true,
      discount: true,
      pointsRedeemed: true,
      totalAmount: true,
      cartItemIds: true,
    },
  });

  if (order.couponId) {
    const coupon = await tx.coupon.findUnique({
      where: { id: order.couponId },
      select: { usageLimit: true },
    });
    const bumped = await tx.coupon.updateMany({
      where:
        coupon?.usageLimit == null
          ? { id: order.couponId }
          : { id: order.couponId, currentUsage: { lt: coupon.usageLimit } },
      data: { currentUsage: { increment: 1 } },
    });
    if (bumped.count === 1) {
      await tx.couponUsage.create({
        data: { couponId: order.couponId, userId: order.userId, orderId, discount: Number(order.discount) },
      });
    } else {
      console.warn(`[order] ${orderId}: coupon hit its usage limit before the payment completed; discount honoured, usage not recorded`);
    }
  }

  if (order.pointsRedeemed > 0) {
    const wallet = await tx.pointsWallet.findUnique({
      where: { userId: order.userId },
      select: { availablePoints: true },
    });
    const redeemable = Math.min(order.pointsRedeemed, wallet?.availablePoints ?? 0);
    if (redeemable > 0) {
      // totalAmount is already net of the redemption, so add it back for the cap check.
      const orderValue = Number(order.totalAmount) + order.pointsRedeemed * POINT_VALUE;
      await redeemPoints(order.userId, redeemable, orderValue, { reason: "Redeemed at checkout", reference: orderId }, tx);
    }
    if (redeemable < order.pointsRedeemed) {
      console.warn(`[order] ${orderId}: only ${redeemable} of ${order.pointsRedeemed} points were still available at payment; discount honoured`);
    }
  }

  /*
   * Remove exactly the lines this order was built from. Anything the customer put in their cart
   * while they were away on the payment page is left alone.
   */
  const purchased = new Set((Array.isArray(order.cartItemIds) ? order.cartItemIds : []).map(String));
  if (purchased.size > 0) {
    const [locked] = await tx.$queryRaw<{ cart: unknown }[]>`
      SELECT "cart" FROM "User" WHERE "id" = ${order.userId}::uuid FOR UPDATE`;
    const current = Array.isArray(locked?.cart) ? (locked.cart as { id?: string }[]) : [];
    const remaining = current.filter((item) => !purchased.has(String(item?.id)));
    if (remaining.length !== current.length) {
      await tx.user.update({ where: { id: order.userId }, data: { cart: remaining } });
    }
  }
}

/**
 * Record the gateway payment an order is waiting on. paymentId is unique across orders, so a
 * webhook or a return can only ever resolve to the order that actually created that payment.
 */
export async function setOrderPayment(orderId: string, paymentId: string): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentId, paymentStatus: "PENDING", paymentProvider: "SKIPCASH" },
  });
}

/**
 * Mark an order paid and apply its effects — ONCE. Returns true if this call was the one that
 * did it, false if the order was already paid (a duplicate webhook, a refreshed return page, or
 * the two racing each other). Safe to call any number of times, from anywhere.
 */
export async function confirmOrderPaid(
  orderId: string,
  payment: { provider?: string; paymentTxnId?: string | null } = {}
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    // The conditional update is the lock: only one caller can move the row out of "not paid".
    const claimed = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: { not: "PAID" } },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        paymentFailureReason: null,
        ...(payment.provider ? { paymentProvider: payment.provider } : {}),
        ...(payment.paymentTxnId ? { paymentTxnId: payment.paymentTxnId } : {}),
      },
    });
    if (claimed.count !== 1) return false;

    await applyPaidEffects(tx, orderId);
    return true;
  }, { maxWait: 10_000, timeout: 20_000 });
}

/**
 * Record a non-paid payment outcome. A paid order is never demoted by a late or replayed
 * callback — a refund is the only status that legitimately follows PAID.
 */
export async function setOrderPaymentStatus(
  orderId: string,
  status: "PENDING" | "FAILED" | "CANCELLED" | "REFUNDED",
  reason?: string
): Promise<void> {
  await prisma.order.updateMany({
    where: status === "REFUNDED" ? { id: orderId } : { id: orderId, paymentStatus: { not: "PAID" } },
    data: { paymentStatus: status, paymentFailureReason: reason?.slice(0, 255) ?? null },
  });
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
    select: { id: true, userId: true, status: true, pointsRedeemed: true, paymentStatus: true },
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

    /*
     * Only refund what was actually spent. Points are redeemed when the payment is confirmed,
     * so cancelling an order that was never paid must not credit points into the wallet.
     */
    if (order.pointsRedeemed > 0 && order.paymentStatus === "PAID") {
      await refundPoints(order.userId, order.pointsRedeemed, { reason: "Order cancelled", reference: orderId }, tx);
    }
  });
}
