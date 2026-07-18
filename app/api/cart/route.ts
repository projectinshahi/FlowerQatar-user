import { NextResponse } from "next/server";
import { resolveActiveUserId, getCartPayload, clearCart, CartError } from "@/lib/services/cart";

function fail(e: any, fallback: string) {
  const status = e instanceof CartError ? e.status : 500;
  if (status >= 500) console.error("[api/cart]", e);
  return NextResponse.json({ success: false, error: e?.message || fallback }, { status });
}

// GET /api/cart — return the complete cart (with totals)
export async function GET() {
  try {
    const cartId = await resolveActiveUserId();
    const data = await getCartPayload(cartId);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return fail(e, "Failed to load cart");
  }
}

// DELETE /api/cart — clear the cart
export async function DELETE() {
  try {
    const cartId = await resolveActiveUserId();
    const data = await clearCart(cartId);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return fail(e, "Failed to clear cart");
  }
}
