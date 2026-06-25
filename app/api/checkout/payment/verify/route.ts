import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { razorpayService } from "@/lib/razorpay/razorpay.service";
import { generateAndUploadInvoice } from "@/lib/invoice/generateInvoice";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("[Verify Payment] User unauthenticated");
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      console.error("[Verify Payment] Missing details", { razorpay_order_id, transactionId });
      return NextResponse.json({ error: "Missing required payment details" }, { status: 400 });
    }

    // Check transaction state using raw SQL
    const transactions: any[] = await prisma.$queryRaw`
      SELECT * FROM "payment_transactions" WHERE id = ${transactionId}
    `;
    const transaction = transactions[0];

    if (!transaction) {
      return NextResponse.json({ error: "Payment transaction not found" }, { status: 404 });
    }

    if (transaction.status === "SUCCESS") {
      console.warn(`[Verify Payment] Order already verified for Transaction ID: ${transactionId}`);
      return NextResponse.json({ success: true, orderId: transaction.order_id });
    }

    // Verify signature
    const isValid = razorpayService.verifySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      await prisma.$executeRaw`
        UPDATE "payment_transactions" 
        SET status = 'FAILED', failure_reason = 'Signature mismatch' 
        WHERE id = ${transactionId}
      `;
      console.error(`[Verify Payment] Invalid signature for Razorpay Order ID: ${razorpay_order_id}`);
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Prepare data from snapshot
    const pricing = transaction.pricing_snapshot as any;
    const cartSnap = transaction.cart_snapshot as any;
    const cartItems = cartSnap?.cartItems || [];
    const checkoutData = cartSnap?.checkoutData || {};

    // Generate a human‑readable order number
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    let finalOrderId = "";

    // Process order in a transaction
    await prisma.$transaction(async (tx) => {
      if (pricing.coupon) {
        const currentCoupon = await tx.coupons.findUniqueOrThrow({
          where: { id: pricing.coupon.id },
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
          data: { coupon_id: currentCoupon.id, user_id: userId },
        });
        const updated = await tx.coupons.updateMany({
          where: { id: currentCoupon.id, used_count: currentCoupon.used_count },
          data: { used_count: { increment: 1 } },
        });
        if (updated.count !== 1) throw new Error("Coupon usage changed; retry checkout");
      }

      // Create Final Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          orderNumber,
          customerName: checkoutData.address?.fullName || checkoutData.address?.name || session.user.name || "Guest",
          customerEmail: session.user.email || "",
          customerPhone: checkoutData.address?.phone || "",
          subtotal: pricing.subtotal || 0,
          shippingCost: pricing.shipping || 0,
          discount: pricing.discount || 0,
          tax: pricing.tax || 0,
          total: pricing.total || 0,
          status: "processing",
          paymentStatus: "paid",
          paymentMethod: "razorpay",
          shippingAddress: checkoutData.address || {},
          couponId: pricing.coupon?.id,
          couponCode: pricing.coupon?.code,
        },
      });
      finalOrderId = newOrder.id;

      if (pricing.coupon) {
        await tx.coupon_usages.update({
          where: {
            coupon_id_user_id: {
              coupon_id: pricing.coupon.id,
              user_id: userId,
            },
          },
          data: { order_id: newOrder.id },
        });
      }

      // Extract product details for OrderItems
      const productIds = cartItems.map((item: any) => item.product_id);
      const products = await tx.products.findMany({
        where: { id: { in: productIds } },
      });

      const orderItemsToCreate = cartItems.map((item: any) => {
        const product = products.find((p) => p.id === item.product_id);
        const price = Number(product?.sale_price || product?.price || 0);
        return {
          orderId: newOrder.id,
          productId: item.product_id,
          productTitle: product?.name || "Unknown Product",
          quantity: item.quantity,
          unitPrice: price,
          totalPrice: price * item.quantity,
          options: { size: item.size, thickness: item.thickness, mounting: item.mounting_method },
        };
      });

      if (orderItemsToCreate.length > 0) {
        await tx.orderItem.createMany({ data: orderItemsToCreate });
      }

      // Add order timeline
      await tx.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          status: "Order Placed",
          note: "Payment successfully verified and order created.",
        }
      });

      // Update PaymentTransaction using raw SQL
      await tx.$executeRaw`
        UPDATE "payment_transactions" 
        SET status = 'SUCCESS', order_id = ${newOrder.id}, razorpay_payment_id = ${razorpay_payment_id}, razorpay_signature = ${razorpay_signature}
        WHERE id = ${transactionId}
      `;

      // Clear actual DB cart items since payment succeeded
      await tx.cart_items.deleteMany({
        where: { user_id: userId },
      });
    });

    console.log(`[Verify Payment] Successfully verified payment and created Order Number: ${orderNumber}`);

    // Trigger invoice generation asynchronously
    setTimeout(() => {
      generateAndUploadInvoice(finalOrderId).catch(err =>
        console.error("Async invoice generation failed:", err)
      );
    }, 0);

    return NextResponse.json({ success: true, orderId: finalOrderId, orderNumber });
  } catch (error) {
    console.error("[Verify Payment] Verification Error:", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
