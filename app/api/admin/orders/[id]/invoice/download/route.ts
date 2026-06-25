import { withHandler } from "@/lib/api/handler";
import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { InvoiceDocument } from "@/components/Admin/InvoicePreview/InvoiceDocument";
import React from "react";
import { getInvoiceData } from "@/lib/invoice/generateInvoice";

export const GET = withHandler(
  async ({ params }): Promise<NextResponse> => {
    const orderId = params?.id;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    try {
      const invoiceData = await getInvoiceData(orderId as string);

      // Generate the PDF stream
      const stream = await renderToStream(React.createElement(InvoiceDocument, { data: invoiceData }) as any);

      // Return the stream directly in NextResponse
      const filename = `Invoice_${invoiceData.orderNumber}.pdf`;

      // Next.js Response doesn't naturally handle NodeJS ReadableStreams without passing through ReadableStream (web standard).
      // Converting Node stream to Web stream:
      const webStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => controller.enqueue(chunk));
          stream.on('end', () => controller.close());
          stream.on('error', (err) => controller.error(err));
        }
      });

      return new NextResponse(webStream, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      if (error.message === "Order not found") {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
    }
  },
  { access: "admin" }
);
