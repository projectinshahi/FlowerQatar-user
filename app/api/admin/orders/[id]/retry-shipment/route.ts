import { NextResponse } from "next/server";
import { createShipment } from "@/lib/delhivery";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Basic admin check - ideally verify user role
    const profile = await prisma.user_profiles.findUnique({
      where: { user_id: session.user.id },
      include: { roles: true }
    });

    if (profile?.roles?.name !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Order ID is required" }, { status: 400 });
    }

    const shipmentData = await createShipment(id);

    if (!shipmentData.success) {
      return NextResponse.json({ success: false, error: shipmentData.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, awb: shipmentData.awb });
  } catch (error: any) {
    console.error("Retry Shipment API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
