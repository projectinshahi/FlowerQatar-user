import { NextResponse } from "next/server";
import { getTrackingStatus } from "@/lib/delhivery";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ awb: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { awb } = await context.params;
    if (!awb) {
      return NextResponse.json({ success: false, error: "AWB is required" }, { status: 400 });
    }

    const trackingData = await getTrackingStatus(awb);

    if (!trackingData.success) {
      return NextResponse.json({ success: false, error: trackingData.error }, { status: 502 });
    }

    return NextResponse.json({ success: true, data: trackingData });
  } catch (error: any) {
    console.error("Tracking API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
