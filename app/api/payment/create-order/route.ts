import crypto from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withHandler } from "@/lib/api/handler";
import { calculateCheckout } from "@/lib/checkout.service";
import { CouponError } from "@/lib/coupon.service";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay.server";
import { createPaymentOrderSchema } from "@/schema/payment.schema";

export const dynamic = "force-dynamic";

export const POST = withHandler(async ({ req, user }) => {
  const parsed = createPaymentOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const checkout = await calculateCheckout(prisma, user.id, parsed.data.couponCode);
    const amountInPaise = Math.round(checkout.pricing.total * 100);
    if (amountInPaise < 100) {
      return NextResponse.json({ success: false, message: "Order total must be at least ₹1" }, { status: 400 });
    }

    const razorpayOrder = await getRazorpayClient().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `checkout_${crypto.randomUUID().slice(0, 18)}`,
      notes: { userId: user.id },
    });

    const session = await prisma.paymentSession.create({
      data: {
        userId: user.id,
        razorpayOrderId: razorpayOrder.id,
        amount: new Prisma.Decimal(checkout.pricing.total),
        currency: "INR",
        status: "CREATED",
        couponCode: checkout.pricing.coupon?.code ?? null,
        pricingSnapshot: checkout.pricing,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      razorpayOrderId: razorpayOrder.id,
      amount: checkout.pricing.total,
      amountInPaise,
      currency: "INR",
      pricing: checkout.pricing,
    });
  } catch (error) {
    if (error instanceof CouponError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Payment initiation failed";
    console.error("[payment/create-order]", error);
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}, { access: "user", rateLimit: { max: 10, windowMs: 60_000 } });
