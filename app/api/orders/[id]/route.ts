import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api/handler";
import { prisma } from "@/lib/prisma";

export const GET = withHandler(async ({ params, user }) => {
  const order = await prisma.order.findFirst({
    where: { id: params?.id, userId: user.id },
    include: { payment: true },
  });
  if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    data: {
      id: order.id,
      order_number: order.orderNumber,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      shipping_address: order.shippingAddress,
      status: order.status,
      payment_status: order.paymentStatus,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shipping_cost: Number(order.shippingCost),
      discount: Number(order.discount),
      total: Number(order.total),
      notes: order.notes,
      payment_method: order.paymentMethod,
      razorpay_order_id: order.payment?.razorpayOrderId,
      razorpay_payment_id: order.payment?.razorpayPaymentId,
      amount_paid: order.payment ? Number(order.payment.amount) : null,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      invoice_generated: order.invoiceGenerated,
      invoice_url: order.invoiceUrl,
      shipping_provider: order.shippingProvider,
      shipping_awb: order.shippingAwb,
      shipping_status: order.shippingStatus,
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}, { access: "user" });
