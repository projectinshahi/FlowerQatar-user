import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCouponSchema } from "@/lib/validations/marketing";
import { validateCoupon } from "@/lib/services/marketing";
import { getCurrentCustomer } from "@/lib/customer-guard";

/**
 * POST /api/coupons/validate
 * Checks a coupon against the cart without recording usage. Works for guests
 * (userId optional); per-customer limits require a signed-in customer.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validateCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ valid: false, reason: parsed.error.issues[0].message }, { status: 400 });
    }

    const user = await getCurrentCustomer();
    const result = await validateCoupon(parsed.data.code, parsed.data.items, user?.id ?? null);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ valid: false, reason: error.issues[0].message }, { status: 400 });
    }
    console.error("Coupon validate error:", error);
    return NextResponse.json({ valid: false, reason: "Failed to validate coupon" }, { status: 500 });
  }
}
