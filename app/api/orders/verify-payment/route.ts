import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: false,
    message: "This payment endpoint has been retired. Use /api/payment/verify.",
  }, { status: 410 });
}
