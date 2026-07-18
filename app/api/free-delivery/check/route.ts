import { NextResponse } from "next/server";
import { z } from "zod";
import { cartOnlySchema } from "@/lib/validations/marketing";
import { checkFreeDelivery } from "@/lib/services/marketing";

/**
 * POST /api/free-delivery/check
 * Returns whether the cart qualifies for free delivery and, if not, how much
 * more is needed to reach the nearest campaign threshold.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = cartOnlySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ eligible: false, reason: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await checkFreeDelivery(parsed.data.items);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ eligible: false, reason: error.issues[0].message }, { status: 400 });
    }
    console.error("Free delivery check error:", error);
    return NextResponse.json({ eligible: false, reason: "Failed to check free delivery" }, { status: 500 });
  }
}
