import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withHandler } from "@/lib/api/handler";
import { prisma } from "@/lib/prisma";
import { paymentFailureSchema } from "@/schema/payment.schema";

export const POST = withHandler(async ({ req, user }) => {
  const parsed = paymentFailureSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ success: false }, { status: 400 });

  await prisma.paymentFailureLog.create({
    data: {
      userId: user.id,
      razorpayOrderId: parsed.data.razorpayOrderId,
      errorCode: parsed.data.errorCode,
      errorDescription: parsed.data.errorMessage,
      errorSource: "checkout",
      rawPayload: (parsed.data.payload ?? {}) as Prisma.InputJsonValue,
    },
  });

  if (parsed.data.razorpayOrderId) {
    await prisma.paymentSession.updateMany({
      where: {
        razorpayOrderId: parsed.data.razorpayOrderId,
        userId: user.id,
        status: { not: "SUCCESS" },
      },
      data: { status: "FAILED" },
    });
  }

  return NextResponse.json({ success: true });
}, { access: "user", rateLimit: { max: 20, windowMs: 60_000 } });
