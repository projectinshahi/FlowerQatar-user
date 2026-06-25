import { getServerSession } from "next-auth/react";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { razorpayOrderId, errorCode, errorMessage, payload } = body;

    if (razorpayOrderId) {
      await prisma.paymentSession.updateMany({
        where: { razorpayOrderId },
        data: { status: "FAILED", updatedAt: new Date() },
      });
    }

    await prisma.paymentFailureLog.create({
      data: {
        userId: session?.user?.id || "anonymous",
        razorpayOrderId: razorpayOrderId || null,
        errorCode: errorCode || "UNKNOWN",
        errorDescription: errorMessage || "Payment failed",
        errorSource: "razorpay_checkout",
        rawPayload: payload || {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment failure log error:", error);
    return NextResponse.json({ error: "Failed to log payment failure" }, { status: 500 });
  }
}
