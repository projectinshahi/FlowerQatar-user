import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { addCalendarValidity } from "@/lib/validity";
import { creditPoints } from "@/lib/services/wallet";

export class MembershipError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "MembershipError";
    this.status = status;
  }
}

/**
 * Flip any of the user's past-due ACTIVE memberships to EXPIRED (lazy expiry — no cron needed).
 * History rows are never deleted (PART 13). Always scoped to the authenticated user.
 */
export async function expireStaleMemberships(userId: string): Promise<void> {
  await prisma.membership.updateMany({
    where: { userId, status: "ACTIVE", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

/** The user's current ACTIVE membership (with plan), or null. Expires stale ones first. */
export async function getActiveMembership(userId: string) {
  // Run together: the read only matches rows that have not expired, which the update never
  // touches, so the result is the same as expiring first.
  const [, membership] = await Promise.all([
    expireStaleMemberships(userId),
    prisma.membership.findFirst({
      where: { userId, status: "ACTIVE", expiresAt: { gt: new Date() } },
      include: { plan: true },
      orderBy: { expiresAt: "desc" },
    }),
  ]);
  return membership;
}

/**
 * Start a membership purchase.
 *
 * Creates the membership as PENDING: it grants nothing, credits nothing and is invisible to
 * getActiveMembership() until the payment has been verified with the gateway. The price comes
 * from the plan row here and nowhere else — the browser never sends an amount.
 *
 * Idempotent via `idempotencyKey`: a repeated call (double click, retried request) returns the
 * membership that already exists instead of starting a second purchase.
 */
export async function createPendingMembership(userId: string, planId: string, idempotencyKey: string) {
  const prior = await prisma.membership.findUnique({ where: { idempotencyKey }, include: { plan: true } });
  if (prior) {
    if (prior.userId !== userId) throw new MembershipError("Invalid request", 403);
    return prior;
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new MembershipError("Plan not found", 404);
  if (!plan.isActive) throw new MembershipError("This plan is not available", 400);

  /*
   * Provisional dates. The real ones are set when the payment is verified, so a membership
   * cannot start running while the customer is still on the gateway's card form.
   */
  const startsAt = new Date();
  const expiresAt = addCalendarValidity(startsAt, {
    years: plan.validityYears,
    months: plan.validityMonths,
    days: plan.validityDays,
  });

  try {
    return await prisma.membership.create({
      data: {
        userId,
        planId: plan.id,
        status: "PENDING",
        startsAt,
        expiresAt,
        pointsCredited: plan.featurePoints,
        pricePaid: plan.price,
        paymentGateway: "SKIPCASH",
        paymentMethod: "CARD",
        paymentStatus: "PENDING",
        idempotencyKey,
      },
      include: { plan: true },
    });
  } catch (e) {
    // A concurrent request with the same key won the race — return the winner.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const winner = await prisma.membership.findUnique({ where: { idempotencyKey }, include: { plan: true } });
      if (winner) return winner;
    }
    throw e;
  }
}

/**
 * Record the gateway payment this membership is waiting on. paymentId is unique, so a webhook
 * or a return can only ever resolve to the membership that created that payment.
 */
export async function setMembershipPayment(membershipId: string, paymentId: string): Promise<void> {
  await prisma.membership.update({
    where: { id: membershipId },
    data: { paymentId, paymentStatus: "PENDING", paymentGateway: "SKIPCASH" },
  });
}

/**
 * Record a non-paid payment outcome. The membership stays PENDING — it grants nothing either
 * way, and leaving it pending means a genuine late "paid" callback can still settle it. A paid
 * membership is never demoted by a replayed callback; only a refund legitimately follows PAID.
 */
export async function setMembershipPaymentStatus(
  membershipId: string,
  status: "PENDING" | "FAILED" | "CANCELLED" | "REFUNDED",
  reason?: string
): Promise<void> {
  await prisma.membership.updateMany({
    where: status === "REFUNDED" ? { id: membershipId } : { id: membershipId, paymentStatus: { not: "PAID" } },
    data: { paymentStatus: status, paymentFailureReason: reason?.slice(0, 255) ?? null },
  });
}

/**
 * Activate a membership whose payment has been verified — ONCE. Returns true if this call was
 * the one that did it, false if it was already settled (a duplicate webhook, a refreshed return
 * page, or the two racing each other). The conditional update is the lock: only one caller can
 * move the row out of "not paid", so the points can only ever be credited once.
 *
 * The validity window starts now, at the moment the money is confirmed, and its length comes
 * from the plan — the existing calendar-correct duration logic, unchanged.
 */
export async function confirmMembershipPaid(
  membershipId: string,
  payment: { provider?: string; method?: string; paymentTxnId?: string | null } = {}
): Promise<boolean> {
  return prisma.$transaction(
    async (tx) => {
      const membership = await tx.membership.findUnique({
        where: { id: membershipId },
        select: {
          userId: true,
          pointsCredited: true,
          plan: {
            select: { planType: true, validityYears: true, validityMonths: true, validityDays: true },
          },
        },
      });
      if (!membership) return false;

      const startsAt = new Date();
      const expiresAt = addCalendarValidity(startsAt, {
        years: membership.plan.validityYears,
        months: membership.plan.validityMonths,
        days: membership.plan.validityDays,
      });

      const claimed = await tx.membership.updateMany({
        where: { id: membershipId, paymentStatus: { not: "PAID" } },
        data: {
          status: "ACTIVE",
          paymentStatus: "PAID",
          paidAt: startsAt,
          startsAt,
          expiresAt,
          paymentFailureReason: null,
          ...(payment.provider ? { paymentGateway: payment.provider } : {}),
          ...(payment.method ? { paymentMethod: payment.method } : {}),
          ...(payment.paymentTxnId ? { paymentTxnId: payment.paymentTxnId } : {}),
        },
      });
      if (claimed.count !== 1) return false;

      // The points recorded on the membership at purchase time, not today's plan value, so the
      // customer gets exactly what they paid for even if the plan was edited in between.
      if (membership.pointsCredited > 0) {
        await creditPoints(
          membership.userId,
          membership.pointsCredited,
          {
            type: "SUBSCRIPTION_PURCHASED",
            reason: `Points credited for ${membership.plan.planType} membership`,
            reference: membershipId,
          },
          tx
        );
      }
      return true;
    },
    { maxWait: 10_000, timeout: 20_000 }
  );
}
