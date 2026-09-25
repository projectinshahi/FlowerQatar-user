import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { createPendingOrder, setOrderPayment, setOrderPaymentStatus, OrderError } from "@/lib/services/order";
import { createPayment, PaymentError } from "@/lib/services/skipcash";
import { WalletError } from "@/lib/services/wallet";

const schema = z.object({
  shippingMethod: z.enum(["standard", "courier"]).optional(),
  couponCode: z.string().max(50).optional().nullable(),
  pointsRedeemed: z.number().int().min(0).optional(),
  shippingInfo: z.object({
    firstName: z.string().trim().min(1, "First name is required").max(80, "First name is too long"),
    lastName: z.string().trim().min(1, "Last name is required").max(80, "Last name is too long"),
    email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
    // 8 digits is a local Qatari number, 15 the international maximum.
    phone: z
      .string()
      .trim()
      .max(40)
      .refine(
        (v) => /^\+?[\d\s-]+$/.test(v) && v.replace(/\D/g, "").length >= 8,
        "Enter a valid phone number"
      ),
    address: z.string().trim().min(1, "Street address is required").max(255, "Address is too long"),
    city: z.string().trim().min(1, "City is required").max(120, "City is too long"),
    // Optional: Qatar operates no postal-code system (lib/postal.ts).
    zip: z.string().trim().max(20, "Postal code is too long").optional().default(""),
  }),
});

/**
 * GET /api/orders — the authenticated user's own order history (scoped to their userId).
 * Guests get an empty list rather than a 401, matching the cart's graceful pattern.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: true, orders: [] });

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: { select: { name: true, slug: true } } } },
    },
  });
  return NextResponse.json({ success: true, orders });
}

/**
 * POST /api/orders — start an order for the authenticated user. The server re-derives all
 * amounts from the authoritative cart (client prices are never trusted) and records the Order
 * (+ items) as UNPAID, then opens a SkipCash payment for that server-calculated amount and
 * returns its `payUrl` for the browser to hand the customer over to.
 *
 * The cart, the points and the coupon are deliberately untouched here: they are only spent
 * when the payment comes back verified (see lib/services/skipcash.ts). An order that is fully
 * covered by points/discounts has nothing to pay, so it comes back `paid` with no payUrl.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Please sign in to place an order." }, { status: 401 });
  }

  try {
    const input = schema.parse(await request.json());
    const order = await createPendingOrder(user.id, input);
    if (order.paid) {
      return NextResponse.json({ success: true, ...order }, { status: 201 });
    }

    try {
      const payment = await createPayment({
        reference: order.orderId,
        // The SERVER's figure for this order — never an amount supplied by the browser.
        amount: order.totalAmount,
        customer: {
          firstName: input.shippingInfo?.firstName ?? user.firstName ?? undefined,
          lastName: input.shippingInfo?.lastName ?? user.lastName ?? undefined,
          email: input.shippingInfo?.email ?? user.email,
          phone: input.shippingInfo?.phone,
        },
      });
      await setOrderPayment(order.orderId, payment.paymentId);
      return NextResponse.json({ success: true, ...order, payUrl: payment.payUrl }, { status: 201 });
    } catch (e) {
      // The gateway refused or never answered. The order is parked as FAILED; the customer's
      // cart, points and coupon were never touched, so they can simply try again.
      await setOrderPaymentStatus(
        order.orderId,
        "FAILED",
        e instanceof PaymentError ? e.message : "Could not start the payment"
      );
      throw e;
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: e.issues[0].message }, { status: 400 });
    }
    if (e instanceof OrderError || e instanceof WalletError || e instanceof PaymentError) {
      return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    }
    console.error("[api/orders]", e);
    return NextResponse.json({ success: false, error: "Could not place your order" }, { status: 500 });
  }
}
