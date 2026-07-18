import { NextResponse } from "next/server";
import { z } from "zod";
import { applyCouponSchema } from "@/lib/validations/marketing";
import { applyCoupon } from "@/lib/services/marketing";
import { requireUser, AuthError } from "@/lib/admin-guard";

/**
 * POST /api/coupons/apply
 * Validates and atomically records a coupon usage. Requires an authenticated
 * customer so per-customer usage can be enforced and attributed.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();

    const body = await request.json();
    const parsed = applyCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ valid: false, reason: parsed.error.issues[0].message }, { status: 400 });
    }

    const result = await applyCoupon(
      parsed.data.code,
      parsed.data.items,
      user.id,
      parsed.data.orderId ?? null
    );

    return NextResponse.json(result, { status: result.valid ? 200 : 400 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ valid: false, reason: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ valid: false, reason: error.issues[0].message }, { status: 400 });
    }
    console.error("Coupon apply error:", error);
    return NextResponse.json({ valid: false, reason: "Failed to apply coupon" }, { status: 500 });
  }
}
