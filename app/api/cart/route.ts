import { NextResponse } from "next/server";
import { getActiveUserId, getCartPayload, clearCart, emptyCart, CartError } from "@/lib/services/cart";

function fail(e: any, fallback: string) {
  const status = e instanceof CartError ? e.status : 500;
  if (status >= 500) console.error("[api/cart]", e);
  return NextResponse.json({ success: false, error: e?.message || fallback }, { status });
}

// GET /api/cart — the complete cart (with totals). Guests get an empty cart, never a 401,
// so the storefront can load a guest cart state without console/network errors.
export async function GET() {
  try {
    const userId = await getActiveUserId();
    const data = userId ? await getCartPayload(userId) : emptyCart();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return fail(e, "Failed to load cart");
  }
}

// DELETE /api/cart — clear the cart. Guests have no server cart, so this is a no-op empty cart.
export async function DELETE() {
  try {
    const userId = await getActiveUserId();
    const data = userId ? await clearCart(userId) : emptyCart();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return fail(e, "Failed to clear cart");
  }
}
