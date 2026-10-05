import { NextResponse } from "next/server";
import { updateItemSchema } from "@/lib/validations/cart";
import { resolveSessionUserId, updateItemQuantity, removeItem, CartError } from "@/lib/services/cart";

function fail(e: any, fallback: string) {
  const status = e instanceof CartError ? e.status : 500;
  if (status >= 500) console.error("[api/cart/item]", e);
  return NextResponse.json({ success: false, error: e?.message || fallback }, { status });
}

// PATCH /api/cart/item/:id — update quantity (0 removes the item)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }
    const cartId = await resolveSessionUserId();
    const data = await updateItemQuantity(cartId, id, parsed.data.quantity);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return fail(e, "Failed to update item");
  }
}

// DELETE /api/cart/item/:id — remove a single item
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cartId = await resolveSessionUserId();
    const data = await removeItem(cartId, id);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return fail(e, "Failed to remove item");
  }
}
