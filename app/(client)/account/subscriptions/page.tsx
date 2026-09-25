import { getCurrentUser } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { expireStaleMemberships } from "@/lib/services/membership";
import { getWalletView } from "@/lib/services/wallet";
import MembershipPanel, { type MembershipView } from "@/components/subscriptions/MembershipPanel";
import SubscriptionsManager from "@/components/subscriptions/SubscriptionsManager";

export const metadata = { title: "Subscriptions" };

export default async function SubscriptionsPage() {
  /*
   * The account layout already guards this route, and getCurrentUser is cache()d, so this
   * costs no extra query. The membership and the wallet are read here rather than from the
   * browser, so they are part of the page's own render — no second request, no loading flash.
   */
  const user = await getCurrentUser();
  if (!user) return <SubscriptionsManager />;

  // Flip any past-due membership to EXPIRED first, so what is shown is what is true today.
  await expireStaleMemberships(user.id);

  const [rows, wallet] = await Promise.all([
    prisma.membership.findMany({
      // A PENDING row is an unfinished purchase: nothing was bought, so nothing is shown.
      where: { userId: user.id, status: { not: "PENDING" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        startsAt: true,
        expiresAt: true,
        paidAt: true,
        createdAt: true,
        pointsCredited: true,
        pricePaid: true,
        plan: {
          select: { planType: true, validityYears: true, validityMonths: true, validityDays: true },
        },
      },
    }),
    getWalletView(user.id),
  ]);

  const memberships: MembershipView[] = rows.map((m) => ({
    id: m.id,
    status: m.status,
    startsAt: m.startsAt,
    expiresAt: m.expiresAt,
    // Purchases made before payments were recorded have no paidAt; they started when created.
    purchasedAt: m.paidAt ?? m.createdAt,
    pointsCredited: m.pointsCredited,
    pricePaid: Number(m.pricePaid),
    planType: m.plan.planType,
    validityYears: m.plan.validityYears,
    validityMonths: m.plan.validityMonths,
    validityDays: m.plan.validityDays,
  }));

  return (
    <SubscriptionsManager
      membershipPanel={<MembershipPanel memberships={memberships} points={wallet.availablePoints} />}
    />
  );
}
