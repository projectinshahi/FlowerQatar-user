import { NextResponse } from "next/server";
import { slotsForDate, isValidDeliveryDate } from "@/lib/delivery";

// GET /api/delivery/slots?date=YYYY-MM-DD — time slots for a delivery date.
export async function GET(req: Request) {
  try {
    const date = new URL(req.url).searchParams.get("date") || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, error: "A valid date is required" }, { status: 400 });
    }
    if (!isValidDeliveryDate(date)) {
      return NextResponse.json({ success: false, error: "Delivery is not available on that date" }, { status: 422 });
    }
    return NextResponse.json({ success: true, data: slotsForDate(date) });
  } catch (e) {
    console.error("[delivery/slots]", e);
    return NextResponse.json({ success: false, error: "Could not load time slots" }, { status: 500 });
  }
}
