import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api/handler";
import { calculateCheckout } from "@/lib/checkout.service";
import { CouponError } from "@/lib/coupon.service";
import { prisma } from "@/lib/prisma";
import { applyCouponSchema } from "@/schema/payment.schema";

export const POST = withHandler(async ({ req, user }) => {
  const parsed = applyCouponSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Coupon code is required" }, { status: 400 });
  }

  try {
    const checkout = await calculateCheckout(prisma, user.id, parsed.data.code);
    return NextResponse.json({
      success: true,
      coupon: checkout.pricing.coupon,
      discount: checkout.pricing.discount,
      finalTotal: checkout.pricing.total,
      pricing: checkout.pricing,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Invalid or expired coupon code" },
      { status: error instanceof CouponError ? error.status : 400 },
    );
  }
}, { access: "user", rateLimit: { max: 20, windowMs: 60_000 } });
