import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const orderId = resolvedParams.id;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "preview"; // 'preview' or 'download'

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, invoiceUrl: true, invoiceGenerated: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security: Validate Ownership or Admin role
    const isAdmin = (session.user as any).role?.name === "admin" || (session.user as any).role?.name === "superadmin";
    if (order.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!order.invoiceGenerated || !order.invoiceUrl) {
      return NextResponse.json({ error: "Invoice not yet generated" }, { status: 404 });
    }

    // Fetch the actual PDF
    const pdfResponse = await fetch(order.invoiceUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF from storage: ${pdfResponse.statusText}`);
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    const filename = `Invoice_${order.orderNumber}.pdf`;
    const disposition = action === "download" ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[Customer Invoice API]", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}
