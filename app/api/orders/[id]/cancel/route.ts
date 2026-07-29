import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin-guard";
import { cancelOrder, OrderError } from "@/lib/services/order";

/**
 * POST /api/orders/[id]/cancel — a customer cancels their OWN pre-shipment order.
 * Ownership is enforced in cancelOrder (passing userId); redeemed points are refunded.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ success: false, error: "Please sign in." }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = typeof body?.reason === "string" ? body.reason.slice(0, 255) : undefined;
    await cancelOrder(id, { userId: user.id, reason });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    console.error("[api/orders/cancel]", e);
    return NextResponse.json({ success: false, error: "Could not cancel the order" }, { status: 500 });
  }
}
