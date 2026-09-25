/**
 * Run with: npx tsx --env-file=.env scripts/<this file>
 *
 * One-off sandbox + database check of the membership payment flow.
 * Creates a throwaway user, runs the flow, and deletes everything it made.
 */
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import {
  confirmMembershipPaid,
  createPendingMembership,
  getActiveMembership,
  setMembershipPayment,
  setMembershipPaymentStatus,
} from '../lib/services/membership';
import { confirmSkipCashPayment, createPayment, findPaymentOwner } from '../lib/services/skipcash';

const ok = (label: string, cond: boolean, detail = '') =>
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);

async function main() {

  const plan = await prisma.subscriptionPlan.findFirst({ where: { isActive: true } });
  if (!plan) throw new Error('no active subscription plan to test with');
  console.log(`plan: ${plan.planType}  price=${plan.price}  points=${plan.featurePoints}`);

  const user = await prisma.user.create({
    data: {
      email: `skipcash-check-${randomUUID()}@lebami.test`,
      firstName: 'Sandbox',
      lastName: 'Check',
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  try {
    const key = randomUUID();
    const membership = await createPendingMembership(user.id, plan.id, key);
    ok('pending membership is PENDING', membership.status === 'PENDING', membership.status);
    ok('payment recorded as PENDING', membership.paymentStatus === 'PENDING', membership.paymentStatus);
    ok('price taken from the plan row', Number(membership.pricePaid) === Number(plan.price), String(membership.pricePaid));
    ok('pending membership grants nothing', (await getActiveMembership(user.id)) === null);

    const wallet0 = await prisma.pointsWallet.findUnique({ where: { userId: user.id } });
    ok('no points credited while pending', (wallet0?.availablePoints ?? 0) === 0, String(wallet0?.availablePoints ?? 0));

    // Same key again → the same membership, never a second purchase.
    const again = await createPendingMembership(user.id, plan.id, key);
    ok('idempotency key returns the same membership', again.id === membership.id);

    // Another user must not be able to claim it.
    let denied = false;
    try {
      await createPendingMembership(randomUUID(), plan.id, key);
    } catch (e) {
      denied = (e as { status?: number }).status === 403;
    }
    ok("another user's key is rejected", denied);

    // --- real sandbox call -------------------------------------------------
    const amount = Number(plan.price) > 0 ? Number(plan.price) : 10;
    const payment = await createPayment({
      reference: membership.id,
      amount,
      customer: { firstName: user.firstName!, lastName: user.lastName!, email: user.email },
    });
    ok('SkipCash sandbox created a payment', Boolean(payment.paymentId && payment.payUrl), payment.payUrl?.slice(0, 48));

    await setMembershipPayment(membership.id, payment.paymentId);
    const owner = await findPaymentOwner(payment.paymentId);
    ok('payment resolves to the subscription', owner?.kind === 'SUBSCRIPTION' && owner.membershipId === membership.id);

    // Verify an unpaid payment: SkipCash says "new", so nothing may be activated.
    const verified = await confirmSkipCashPayment(payment.paymentId);
    ok('unpaid payment verifies as PENDING', verified.status === 'PENDING', verified.status);
    ok('membership still not active', (await getActiveMembership(user.id)) === null);

    // --- activation --------------------------------------------------------
    const first = await confirmMembershipPaid(membership.id, { provider: 'SKIPCASH', method: 'CARD', paymentTxnId: 'test-txn' });
    ok('first confirmation activates', first === true);

    const active = await getActiveMembership(user.id);
    ok('membership is ACTIVE', active?.status === 'ACTIVE');
    ok('paidAt recorded', Boolean(active && (active as { paidAt?: Date | null }).paidAt));
    ok('start date set', Boolean(active && active.startsAt <= new Date()));
    ok('end date after start', Boolean(active && active.expiresAt > active.startsAt));

    const wallet1 = await prisma.pointsWallet.findUnique({ where: { userId: user.id } });
    ok('points credited once', (wallet1?.availablePoints ?? 0) === plan.featurePoints, String(wallet1?.availablePoints ?? 0));

    // --- idempotency -------------------------------------------------------
    const second = await confirmMembershipPaid(membership.id, { provider: 'SKIPCASH' });
    ok('duplicate confirmation is a no-op', second === false);
    const wallet2 = await prisma.pointsWallet.findUnique({ where: { userId: user.id } });
    ok('points not credited twice', (wallet2?.availablePoints ?? 0) === plan.featurePoints, String(wallet2?.availablePoints ?? 0));

    const txns = await prisma.walletTransaction.count({ where: { wallet: { userId: user.id } } });
    ok('exactly one wallet transaction', txns === 1, String(txns));

    // A late failure callback must never demote a paid membership.
    await setMembershipPaymentStatus(membership.id, 'FAILED', 'late callback');
    const afterLate = await prisma.membership.findUnique({ where: { id: membership.id } });
    ok('paid membership is not demoted', afterLate?.paymentStatus === 'PAID' && afterLate?.status === 'ACTIVE');

    // --- unknown payment ---------------------------------------------------
    const unknown = await confirmSkipCashPayment('not-a-real-payment-id');
    ok('unknown payment is never paid', unknown.status === 'UNKNOWN' && unknown.kind === null);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
    console.log('cleaned up test user');
  }
}

main()
  .catch((e) => {
    console.error('ERROR', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
