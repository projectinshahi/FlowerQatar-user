import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/orders/[id] — one order, belonging to the signed-in customer.
 *
 * The checkout success screen reads this after the customer comes back from the payment
 * gateway, when the form state that produced the order is long gone. Scoped to the owner:
 * someone else's order id returns 404, not their details.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Please sign in." }, { status: 401 });
  }

  const { id } = await context.params;
  const order = await prisma.order.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      totalAmount: true,
      subtotal: true,
      shippingFee: true,
      tax: true,
      discount: true,
      pointsRedeemed: true,
      paymentMethod: true,
      paymentStatus: true,
      paidAt: true,
      status: true,
      shippingInfo: true,
      createdAt: true,
      items: { include: { product: { select: { name: true, slug: true } } } },
    },
  });
  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, order });
}
