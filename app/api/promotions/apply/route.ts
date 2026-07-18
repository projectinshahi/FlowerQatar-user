import { NextResponse } from "next/server";
import { z } from "zod";
import { cartOnlySchema } from "@/lib/validations/marketing";
import { applyBestPromotion } from "@/lib/services/marketing";

/**
 * POST /api/promotions/apply
 * Auto-detects the best active promotion for the given cart (no auth required —
 * promotions are automatic, cart-based offers).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = cartOnlySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ applied: false, reason: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await applyBestPromotion(parsed.data.items);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ applied: false, reason: error.issues[0].message }, { status: 400 });
    }
    console.error("Promotion apply error:", error);
    return NextResponse.json({ applied: false, reason: "Failed to apply promotion" }, { status: 500 });
  }
}
