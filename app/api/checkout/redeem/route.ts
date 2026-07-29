import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/admin-guard";
import { redeemSchema } from "@/lib/validations/membership";
import { getActiveMembership } from "@/lib/services/membership";
import { redeemPoints, WalletError } from "@/lib/services/wallet";

/**
 * POST /api/checkout/redeem — commit a points redemption when the order is placed.
 *
 * Server is the only authority (PART 9/10): requires an authenticated user + an ACTIVE
 * membership, then redeems ATOMICALLY (no double-spend). `userId` comes only from the
 * session; the client's numbers are re-validated (integer, >0, ≤ wallet, ≤ order value).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Please sign in to redeem points." }, { status: 401 });
  }

  try {
    const { points, orderTotal, reference } = redeemSchema.parse(await request.json());

    if (points <= 0) {
      return NextResponse.json({ success: false, error: "Enter points to redeem." }, { status: 400 });
    }

    // Redemption requires an active (non-expired) membership.
    const membership = await getActiveMembership(user.id);
    if (!membership) {
      return NextResponse.json(
        { success: false, error: "An active membership is required to redeem points." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction((tx) =>
      redeemPoints(
        user.id,
        points,
        orderTotal,
        { reason: "Redeemed at checkout", reference: reference ?? undefined },
        tx
      )
    );

    return NextResponse.json({ success: true, ...result });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: e.issues[0].message }, { status: 400 });
    }
    if (e instanceof WalletError) {
      return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    }
    console.error("[api/checkout/redeem]", e);
    return NextResponse.json({ success: false, error: "Could not redeem points" }, { status: 500 });
  }
}
