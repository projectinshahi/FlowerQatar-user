import { NextResponse } from "next/server";
import { availableDates } from "@/lib/delivery";

// GET /api/delivery/dates — available delivery dates (business rules).
export async function GET() {
  try {
    return NextResponse.json({ success: true, data: availableDates() });
  } catch (e) {
    console.error("[delivery/dates]", e);
    return NextResponse.json({ success: false, error: "Could not load delivery dates" }, { status: 500 });
  }
}
