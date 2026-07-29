import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { addCalendarValidity } from "@/lib/validity";
import { creditPoints } from "@/lib/services/wallet";
import { paymentGateway } from "@/lib/services/payment";

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
  await expireStaleMemberships(userId);
  return prisma.membership.findFirst({
    where: { userId, status: "ACTIVE", expiresAt: { gt: new Date() } },
    include: { plan: true },
    orderBy: { expiresAt: "desc" },
  });
}

/**
 * Subscribe to a plan via SIMULATED payment.
 *
 * - FAILED payment: nothing is written (no membership, no points) — caller handles the UI.
 * - SUCCESS: in ONE transaction, create the membership (calendar-correct expiry) and credit
 *   the plan's points to the wallet with a ledger entry.
 *
 * Idempotent via `idempotencyKey` (anti-replay): a repeated call returns the existing
 * membership instead of creating a duplicate / double-crediting points.
 */
export async function subscribeWithSimulatedPayment(
  userId: string,
  planId: string,
  idempotencyKey: string
) {
  // Fast path: this key already produced a membership → safe replay.
  const prior = await prisma.membership.findUnique({ where: { idempotencyKey }, include: { plan: true } });
  if (prior) {
    if (prior.userId !== userId) throw new MembershipError("Invalid request", 403);
    return prior;
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new MembershipError("Plan not found", 404);
  if (!plan.isActive) throw new MembershipError("This plan is not available", 400);

  // Charge via the (simulated) payment gateway. A FAILED charge writes nothing.
  const payment = await paymentGateway.charge({
    amount: Number(plan.price),
    currency: "QAR",
    reference: idempotencyKey,
  });
  if (payment.status !== "SUCCESS") {
    throw new MembershipError("Payment was not successful", 402);
  }

  const startsAt = new Date();
  const expiresAt = addCalendarValidity(startsAt, {
    years: plan.validityYears,
    months: plan.validityMonths,
    days: plan.validityDays,
  });

  try {
    return await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: {
          userId,
          planId: plan.id,
          status: "ACTIVE",
          startsAt,
          expiresAt,
          pointsCredited: plan.featurePoints,
          pricePaid: plan.price,
          paymentGateway: payment.gateway,
          paymentMethod: payment.method,
          paymentStatus: payment.status,
          paymentTxnId: payment.transactionId,
          idempotencyKey,
        },
        include: { plan: true },
      });
      await creditPoints(
        userId,
        plan.featurePoints,
        {
          type: "SUBSCRIPTION_PURCHASED",
          reason: `Points credited for ${plan.planType} membership`,
          reference: membership.id,
        },
        tx
      );
      return membership;
    });
  } catch (e) {
    // Concurrent duplicate with the same key raced us — return the winner (idempotent).
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const winner = await prisma.membership.findUnique({ where: { idempotencyKey }, include: { plan: true } });
      if (winner) return winner;
    }
    throw e;
  }
}
