import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: false,
    message: "Direct order creation is disabled. Complete payment through checkout.",
  }, { status: 410 });
}
