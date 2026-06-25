import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api/handler";
import { prisma } from "@/lib/prisma";
import { checkoutAddressSchema } from "@/schema/payment.schema";

export const GET = withHandler(async ({ user }) => {
  const order = await prisma.order.findFirst({
    where: { userId: user.id, paymentStatus: "paid" },
    orderBy: { createdAt: "desc" },
    select: { shippingAddress: true },
  });
  const parsed = checkoutAddressSchema.safeParse(order?.shippingAddress);
  return NextResponse.json(parsed.success ? parsed.data : null, {
    headers: { "Cache-Control": "private, no-store" },
  });
}, { access: "user" });
