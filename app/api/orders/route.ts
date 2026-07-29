import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { placeOrder, OrderError } from "@/lib/services/order";
import { WalletError } from "@/lib/services/wallet";

const schema = z.object({
  shippingMethod: z.enum(["standard", "courier"]).optional(),
  couponCode: z.string().max(50).optional().nullable(),
  pointsRedeemed: z.number().int().min(0).optional(),
  shippingInfo: z
    .object({
      firstName: z.string().max(80).optional(),
      lastName: z.string().max(80).optional(),
      email: z.string().max(255).optional(),
      phone: z.string().max(40).optional(),
      address: z.string().max(255).optional(),
      city: z.string().max(120).optional(),
      zip: z.string().max(20).optional(),
    })
    .optional(),
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
 * POST /api/orders — place an order for the authenticated user. Server re-derives all
 * amounts from the authoritative cart (client prices are never trusted), creates the Order
 * (+ items), atomically redeems points, and clears the cart. The order shows in admin.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Please sign in to place an order." }, { status: 401 });
  }

  try {
    const input = schema.parse(await request.json());
    const order = await placeOrder(user.id, input);
    return NextResponse.json({ success: true, ...order }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: e.issues[0].message }, { status: 400 });
    }
    if (e instanceof OrderError || e instanceof WalletError) {
      return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    }
    console.error("[api/orders]", e);
    return NextResponse.json({ success: false, error: "Could not place your order" }, { status: 500 });
  }
}
