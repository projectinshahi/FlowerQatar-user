import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/admin-guard";
import { subscribeSchema } from "@/lib/validations/membership";
import { subscribeWithSimulatedPayment, MembershipError } from "@/lib/services/membership";

/**
 * POST /api/membership/subscribe — subscribe to a plan via SIMULATED payment.
 * Auth required. FAILED payments write nothing. SUCCESS creates the membership and
 * credits points in one transaction (idempotent via idempotencyKey). Server-validated only.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Please sign in to subscribe." }, { status: 401 });
  }

  try {
    const { planId, outcome, idempotencyKey } = subscribeSchema.parse(await request.json());

    // Simulated failure: return safely without creating a membership or crediting points.
    if (outcome === "FAILED") {
      return NextResponse.json({ success: true, paymentStatus: "FAILED" });
    }

    const membership = await subscribeWithSimulatedPayment(user.id, planId, idempotencyKey);
    return NextResponse.json(
      { success: true, paymentStatus: "SUCCESS", membershipId: membership.id },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: e.issues[0].message }, { status: 400 });
    }
    if (e instanceof MembershipError) {
      return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    }
    console.error("[api/membership/subscribe]", e);
    return NextResponse.json({ success: false, error: "Failed to process subscription" }, { status: 500 });
  }
}
