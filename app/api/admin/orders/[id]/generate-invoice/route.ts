import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndUploadInvoice } from "@/lib/invoice/generateInvoice";
import { withHandler } from "@/lib/api/handler";

export const POST = withHandler(async ({ params }) => {
  try {
    const routeParams = await params;
    const orderId = routeParams?.id;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID missing" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Await the generation so admin gets real-time success feedback
    await generateAndUploadInvoice(orderId);

    return NextResponse.json({ success: true, message: "Invoice generated successfully" });
  } catch (error) {
    console.error("[Admin Invoice Generation API]", error);
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
  }
}, { access: "admin" });
