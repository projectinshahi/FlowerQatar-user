import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-guard";
import { getActiveMembership } from "@/lib/services/membership";
import { getWalletView } from "@/lib/services/wallet";
import { planName } from "@/lib/subscription-plans";

/**
 * GET /api/membership — the caller's active membership (if any) + points wallet.
 * Guests get nulls (never a 401), so the checkout can render a guest state cleanly.
 * Everything is scoped to the authenticated customer.
 */
export async function GET() {
  const user = await getCurrentCustomer();
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
