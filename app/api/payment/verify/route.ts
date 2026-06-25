import crypto from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withHandler } from "@/lib/api/handler";
import { calculateCheckout, pricingMatches } from "@/lib/checkout.service";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient, verifyPaymentSignature } from "@/lib/razorpay.server";
import { verifyPaymentSchema } from "@/schema/payment.schema";
import { createShipment, generateInvoice } from "@/lib/triggers";

export const dynamic = "force-dynamic";

export const POST = withHandler(async ({ req, user }) => {
  const raw = await req.json();
  const parsed = verifyPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid payment verification request" }, { status: 400 });
  }

  const data = parsed.data;
  if (!verifyPaymentSignature(data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature)) {
    await prisma.paymentFailureLog.create({
      data: {
        userId: user.id,
        razorpayOrderId: data.razorpay_order_id,
        errorCode: "INVALID_SIGNATURE",
        errorDescription: "Razorpay payment signature mismatch",
        errorSource: "verification",
        rawPayload: raw as Prisma.InputJsonValue,
      },
    });
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const existing = await findCompletedPayment(data.razorpay_order_id, data.razorpay_payment_id);
  if (existing) return completedResponse(existing);

  const session = await prisma.paymentSession.findUnique({
    where: { razorpayOrderId: data.razorpay_order_id },
  });
  if (!session || session.userId !== user.id || session.expiresAt < new Date()) {
    return NextResponse.json({ success: false, message: "Invalid or expired payment session" }, { status: 400 });
  }

  const razorpay = getRazorpayClient();
  let payment = await razorpay.payments.fetch(data.razorpay_payment_id);
  if (payment.status === "authorized") {
    payment = await razorpay.payments.capture(
      data.razorpay_payment_id,
      Math.round(Number(session.amount) * 100),
      session.currency,
    );
  }
  const gatewayAmount = Number(payment.amount) / 100;
  if (
    payment.order_id !== session.razorpayOrderId
    || payment.currency !== session.currency
    || Math.abs(gatewayAmount - Number(session.amount)) >= 0.01
    || payment.status !== "captured"
  ) {
    await logMismatch(user.id, data.razorpay_order_id, payment);
    return NextResponse.json({ success: false, message: "Payment details could not be validated" }, { status: 400 });
  }

  const checkout = await calculateCheckout(prisma, user.id, session.couponCode);
  if (!pricingMatches(session.pricingSnapshot, checkout.pricing) || Math.abs(checkout.pricing.total - gatewayAmount) >= 0.01) {
    return NextResponse.json({
      success: false,
      message: "Your cart total changed. Please return to checkout and retry.",
    }, { status: 409 });
  }

  const address = data.checkoutData.address;
  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.orderPayment.findFirst({
        where: {
          OR: [
            { razorpayOrderId: data.razorpay_order_id },
            { razorpayPaymentId: data.razorpay_payment_id },
          ],
        },
        include: { order: true },
      });
      if (duplicate) return duplicate.order;

      if (checkout.pricing.coupon) {
        const currentCoupon = await tx.coupons.findUniqueOrThrow({
          where: { id: checkout.pricing.coupon.id },
        });
        if (
          !currentCoupon.is_active
          || currentCoupon.deleted
          || currentCoupon.start_date > new Date()
          || currentCoupon.expiry_date < new Date()
          || (currentCoupon.usage_limit !== null && currentCoupon.used_count >= currentCoupon.usage_limit)
        ) {
          throw new Error("Coupon is no longer available");
        }

        await tx.coupon_usages.create({
          data: { coupon_id: currentCoupon.id, user_id: user.id },
        });
        const updated = await tx.coupons.updateMany({
          where: { id: currentCoupon.id, used_count: currentCoupon.used_count },
          data: { used_count: { increment: 1 } },
        });
        if (updated.count !== 1) throw new Error("Coupon usage changed; retry checkout");
      }

      for (const item of checkout.items) {
        const updated = await tx.products.updateMany({
          where: { id: item.product.id, stock: { gte: item.cartItem.quantity } },
          data: { stock: { decrement: item.cartItem.quantity } },
        });
        if (updated.count !== 1) throw new Error(`${item.product.name} is out of stock`);
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          customerName: address.fullName,
          customerEmail: String(user.email ?? "").toLowerCase(),
          customerPhone: address.phone,
          subtotal: new Prisma.Decimal(checkout.pricing.subtotal),
          tax: new Prisma.Decimal(checkout.pricing.tax),
          shippingCost: new Prisma.Decimal(checkout.pricing.shipping),
          discount: new Prisma.Decimal(checkout.pricing.discount),
          total: new Prisma.Decimal(checkout.pricing.total),
          couponId: checkout.pricing.coupon?.id,
          couponCode: checkout.pricing.coupon?.code,
          shippingAddress: address,
          status: "confirmed",
          paymentStatus: "paid",
          paymentMethod: `razorpay:${payment.method ?? "online"}`,
          items: {
            create: checkout.items.map(({ cartItem, product, unitPrice, lineTotal }) => ({
              productId: product.id,
              variantId: cartItem.variant_id,
              productTitle: product.name,
              productImage: getFirstImage(product.images),
              quantity: cartItem.quantity,
              unitPrice: new Prisma.Decimal(unitPrice),
              totalPrice: new Prisma.Decimal(lineTotal),
              options: {
                size: cartItem.size,
                thickness: cartItem.thickness,
                mountingMethod: cartItem.mounting_method,
                orientation: cartItem.orientation,
              },
            })),
          },
          timeline: {
            create: { status: "confirmed", note: "Payment verified and order confirmed" },
          },
          payment: {
            create: {
              razorpayOrderId: data.razorpay_order_id,
              razorpayPaymentId: data.razorpay_payment_id,
              paymentMethod: payment.method ?? "online",
              paymentStatus: String(payment.status).toUpperCase(),
              amountPaid: new Prisma.Decimal(gatewayAmount),
              currency: session.currency,
              capturedAt: payment.status === "captured" ? new Date() : null,
            },
          },
        },
      });

      if (checkout.pricing.coupon) {
        await tx.coupon_usages.update({
          where: {
            coupon_id_user_id: {
              coupon_id: checkout.pricing.coupon.id,
              user_id: user.id,
            },
          },
          data: { order_id: created.id },
        });
      }

      await tx.paymentSession.update({
        where: { id: session.id },
        data: { status: "SUCCESS", completedAt: new Date() },
      });
      await tx.cart_items.deleteMany({ where: { user_id: user.id } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await Promise.allSettled([generateInvoice(order.id), createShipment(order.id)]);
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPaid: gatewayAmount,
    });
  } catch (error) {
    const duplicate = await findCompletedPayment(data.razorpay_order_id, data.razorpay_payment_id);
    if (duplicate) return completedResponse(duplicate);
    console.error("[payment/verify]", error);
    return NextResponse.json({ success: false, message: "Order finalization failed. Please contact support." }, { status: 500 });
  }
}, { access: "user", rateLimit: { max: 15, windowMs: 60_000 } });

async function findCompletedPayment(orderId: string, paymentId: string) {
  return prisma.orderPayment.findFirst({
    where: { OR: [{ razorpayOrderId: orderId }, { razorpayPaymentId: paymentId }] },
    include: { order: true },
  });
}

function completedResponse(payment: NonNullable<Awaited<ReturnType<typeof findCompletedPayment>>>) {
  return NextResponse.json({
    success: true,
    orderId: payment.order.id,
    orderNumber: payment.order.orderNumber,
    amountPaid: Number(payment.amountPaid),
  });
}

function getFirstImage(images: Prisma.JsonValue) {
  if (!Array.isArray(images) || images.length === 0) return null;
  const image = images[0];
  if (typeof image === "string") return image;
  if (image && typeof image === "object" && !Array.isArray(image) && typeof image.url === "string") return image.url;
  return null;
}

async function logMismatch(userId: string, orderId: string, payment: unknown) {
  await prisma.paymentFailureLog.create({
    data: {
      userId,
      razorpayOrderId: orderId,
      errorCode: "PAYMENT_MISMATCH",
      errorDescription: "Gateway payment details did not match the payment session",
      errorSource: "verification",
      rawPayload: payment as Prisma.InputJsonValue,
    },
  });
}
