import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/admin-guard";
import { getActiveMembership } from "@/lib/services/membership";
import { getWalletView } from "@/lib/services/wallet";
import { planName } from "@/lib/subscription-plans";

/**
 * GET /api/membership — the caller's active membership (if any) + points wallet.
 * Guests get nulls (never a 401), so the checkout can render a guest state cleanly.
 * Everything is scoped to the authenticated user id.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: true, data: { membership: null, wallet: null } });
  }

  const [membership, wallet] = await Promise.all([
    getActiveMembership(user.id),
    getWalletView(user.id),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      membership: membership
        ? {
            id: membership.id,
            planName: planName(membership.plan.planType),
            status: membership.status,
            startsAt: membership.startsAt,
            expiresAt: membership.expiresAt,
          }
        : null,
      wallet,
    },
  });
}
