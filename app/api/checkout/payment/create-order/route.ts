import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { razorpayService } from "@/lib/razorpay/razorpay.service";
import { randomUUID } from "crypto";
import { validateCoupon } from "@/lib/coupon.service";

export async function POST(request: Request) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn("[Create Order] User unauthenticated");
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const userId = session.user.id;
    console.log(`[Create Order] Initiated for User ID: ${userId}`);

    // Read checkoutData from request body
    const body = await request.json().catch(() => ({}));
    const { checkoutData } = body;

    // Load cart items
    const cartItems = await prisma.cart_items.findMany({
      where: { user_id: userId },
    });
    if (!cartItems || cartItems.length === 0) {
      console.warn(`[Create Order] Cart is empty for User ID: ${userId}`);
      return NextResponse.json({ error: "Your cart is empty. Please add items to proceed." }, { status: 400 });
    }

    // Compute totals
    const productIds = cartItems.map((i) => i.product_id);
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
    });
    
    let subtotal = 0;
    for (const item of cartItems) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        const price = Number(product.sale_price || product.price);
        subtotal += price * item.quantity;
      }
    }
    
    if (subtotal <= 0) {
      console.error(`[Create Order] Invalid subtotal: ${subtotal} for User ID: ${userId}`);
      return NextResponse.json({ error: "Invalid cart amount. Please review your cart." }, { status: 400 });
    }

    let discount = 0;
    let couponId: string | null = null;
    let couponCodeObj: string | null = null;

    if (checkoutData?.couponCode) {
      try {
        const { coupon, discount: calculatedDiscount } = await validateCoupon(
          prisma,
          checkoutData.couponCode,
          subtotal,
          userId
        );
        discount = calculatedDiscount;
        if (coupon) {
          couponId = coupon.id;
          couponCodeObj = coupon.coupon_code;
        }
      } catch (err: any) {
        console.warn(`[Create Order] Coupon validation failed for Code ${checkoutData.couponCode}: ${err.message}`);
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }

    const shipping = subtotal >= 999 ? 0 : 99;
    const tax = 0;
    const total = Math.max(0, subtotal + shipping - discount + tax);

    // Create Razorpay order (amount in paise)
    const amountInPaise = Math.round(total * 100);
    console.log(`[Create Order] Requesting Razorpay Order for amount: ${amountInPaise} paise`);
    
    console.log("[DEBUG] Checking razorpayService:", typeof razorpayService, typeof razorpayService.createOrder);
    
    let razorpayOrder;
    try {
      razorpayOrder = await razorpayService.createOrder({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${randomUUID().slice(0, 10)}`,
      });
    } catch (err: unknown) {
      console.error("[DEBUG] razorpayService.createOrder failed:", err);
      throw err;
    }

    console.log("[DEBUG] Razorpay order created:", razorpayOrder.id);

    if (!razorpayOrder || !razorpayOrder.id) {
      throw new Error("Razorpay returned an invalid order response.");
    }

    const transactionId = randomUUID();
    try {
      // Bypass Prisma Client caching issue using raw SQL
      await prisma.$executeRaw`
        INSERT INTO "payment_transactions" (
          "id", "user_id", "razorpay_order_id", "amount", "currency",
          "status", "payment_method", "pricing_snapshot", "cart_snapshot", "created_at", "updated_at"
        ) VALUES (
          ${transactionId}, ${userId}, ${razorpayOrder.id}, ${total}, 'INR',
          'PENDING', 'razorpay', 
          ${JSON.stringify({ subtotal, shipping, discount, tax, total, coupon: couponId ? { id: couponId, code: couponCodeObj, discount } : null })}::jsonb, 
          ${JSON.stringify({ cartItems, checkoutData })}::jsonb, 
          NOW(), NOW()
        )
      `;
    } catch (err: unknown) {
      console.error("[DEBUG] prisma.$executeRaw failed:", err);
      throw err;
    }

    console.log(`[Create Order] Successfully created DB Transaction ID: ${transactionId}, Razorpay ID: ${razorpayOrder.id}`);

    // Return data needed by the client
    return NextResponse.json({
      transactionId: transactionId,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID?.trim(),
    });
  } catch (error) {
    console.error("[Create Order] Critical Error:", error);
    const message = error instanceof Error ? error.message : "Failed to create order. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
