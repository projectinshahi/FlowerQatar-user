import { NextResponse } from "next/server";
import { addItemSchema } from "@/lib/validations/cart";
import { resolveActiveUserId, addItem, CartError } from "@/lib/services/cart";

// POST /api/cart/add — add a product (or increase quantity if it already exists)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = addItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const cartId = await resolveActiveUserId();
    const data = await addItem(cartId, parsed.data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e: any) {
    const status = e instanceof CartError ? e.status : 500;
    if (status >= 500) console.error("[api/cart/add]", e);
    return NextResponse.json({ success: false, error: e?.message || "Failed to add to cart" }, { status });
  }
}
