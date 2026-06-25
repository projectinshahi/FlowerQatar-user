import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId, reason, gatewayResponse } = body;

    if (!transactionId) {
      return NextResponse.json({ error: "Missing transaction ID" }, { status: 400 });
    }

    // Update the transaction to FAILED status using raw SQL
    await prisma.$executeRaw`
      UPDATE "payment_transactions" 
      SET status = 'FAILED', 
          failure_reason = ${reason || "Unknown failure"}, 
          gateway_response = ${gatewayResponse ? JSON.stringify(gatewayResponse) : null}::jsonb
      WHERE id = ${transactionId}
    `;
    const transaction = { id: transactionId, status: "FAILED" };

    console.log(`[Payment Fail] Logged failure for Transaction ID: ${transactionId}. Reason: ${reason}`);

    return NextResponse.json({ success: true, transaction });
  } catch (error) {
    console.error("[Payment Fail] Error logging failure:", error);
    return NextResponse.json({ error: "Failed to log payment failure" }, { status: 500 });
  }
}
