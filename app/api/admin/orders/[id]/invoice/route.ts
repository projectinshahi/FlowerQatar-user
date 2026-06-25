import { ok, err, withHandler } from "@/lib/api/handler";
import { NextResponse } from "next/server";
import { getInvoiceData } from "@/lib/invoice/generateInvoice";

export const GET = withHandler(
  async ({ params }): Promise<NextResponse> => {
    const orderId = params?.id;

    if (!orderId) {
      return err("Order ID is required", 400);
    }

    try {
      const invoiceData = await getInvoiceData(orderId as string);
      return ok({ data: invoiceData });
    } catch (error: any) {
      if (error.message === "Order not found") {
        return err("Order not found", 404);
      }
      console.error(error);
      return err("Failed to fetch invoice data", 500);
    }
  },
  { access: "admin" }
);
