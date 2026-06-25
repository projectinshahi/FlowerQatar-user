import crypto from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay.server";
import { createShipment, generateInvoice } from "@/lib/triggers";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature || !verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const event = JSON.parse(body);
  const eventId = req.headers.get("x-razorpay-event-id")
    ?? event.id
    ?? crypto.createHash("sha256").update(body).digest("hex");

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (await tx.processedWebhook.findUnique({ where: { eventId } })) {
        return { duplicate: true, triggerOrderId: null as string | null };
      }

      const payment = event?.payload?.payment?.entity;
      let triggerOrderId: string | null = null;

      if (event.event === "payment.captured" && payment?.order_id) {
        await tx.paymentSession.updateMany({
          where: { razorpayOrderId: payment.order_id, status: { not: "SUCCESS" } },
          data: { status: "CAPTURED" },
        });

        const orderPayment = await tx.orderPayment.findUnique({
          where: { razorpayOrderId: payment.order_id },
        });
        if (orderPayment) {
          await tx.orderPayment.update({
            where: { id: orderPayment.id },
            data: {
              paymentStatus: "CAPTURED",
              razorpayPaymentId: payment.id ?? orderPayment.razorpayPaymentId,
              paymentMethod: payment.method ?? orderPayment.paymentMethod,
              capturedAt: new Date(),
            },
          });
          await tx.order.update({
            where: { id: orderPayment.orderId },
            data: { status: "confirmed", paymentStatus: "paid" },
          });
          triggerOrderId = orderPayment.orderId;
        }
      }

      if (event.event === "payment.failed" && payment) {
        await tx.paymentFailureLog.create({
          data: {
            userId: String(payment.notes?.userId ?? "webhook"),
            razorpayOrderId: payment.order_id,
            errorCode: payment.error_code,
            errorDescription: payment.error_description,
            errorSource: payment.error_source ?? "webhook",
            errorStep: payment.error_step,
            rawPayload: event as Prisma.InputJsonValue,
          },
        });
        if (payment.order_id) {
          await tx.paymentSession.updateMany({
            where: { razorpayOrderId: payment.order_id, status: { not: "SUCCESS" } },
            data: { status: "FAILED" },
          });
        }
      }

      await tx.processedWebhook.create({
        data: { eventId, eventType: String(event.event ?? "unknown") },
      });
      return { duplicate: false, triggerOrderId };
    });

    if (result.triggerOrderId) {
      await Promise.allSettled([
        generateInvoice(result.triggerOrderId),
        createShipment(result.triggerOrderId),
      ]);
    }
    return NextResponse.json({ success: true, duplicate: result.duplicate });
  } catch (error) {
    console.error("[webhooks/razorpay]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
