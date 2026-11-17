import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentCustomer } from "@/lib/customer-guard";
import { subscribeSchema } from "@/lib/validations/membership";
import {
  confirmMembershipPaid,
  createPendingMembership,
  setMembershipPayment,
  setMembershipPaymentStatus,
  MembershipError,
} from "@/lib/services/membership";
import {
  confirmSkipCashPayment,
  createPayment,
  fetchPayment,
  PaymentError,
} from "@/lib/services/skipcash";

/**
 * POST /api/membership/subscribe — start a membership purchase.
 *
 * Auth required. The plan price is read from the database (the browser never sends an amount),
 * a PENDING membership is recorded, and a SkipCash payment is opened for that server-calculated
 * figure. Only `payUrl` goes back to the browser — no credentials, ever.
 *
 * NOTHING is granted here: the membership stays PENDING, no points are credited and no benefit
 * applies until the payment comes back verified (see lib/services/skipcash.ts). Returning from
 * the gateway is not proof of payment, so this route never activates anything itself.
 */
export async function POST(request: Request) {
  const user = await getCurrentCustomer();
  if (!user) {
    return NextResponse.json({ success: false, error: "Please sign in to subscribe." }, { status: 401 });
  }

  try {
    const { planId, idempotencyKey } = subscribeSchema.parse(await request.json());

    // Server-side price: createPendingMembership reads the plan row and copies its price.
    const membership = await createPendingMembership(user.id, planId, idempotencyKey);

    // This key already produced a paid membership (double submit, retried request) — done.
    if (membership.paymentStatus === "PAID") {
      return NextResponse.json({ success: true, paid: true, membershipId: membership.id });
    }

    /*
     * A payment was already opened for this membership. Never replace it: the old payment id
     * is what a late webhook would arrive with, and overwriting it would leave that payment
     * pointing at nothing. Settle it if it has been paid in the meantime, otherwise send the
     * customer back to the payment it already has.
     */
    if (membership.paymentId) {
      const settled = await confirmSkipCashPayment(membership.paymentId);
      if (settled.status === "PAID") {
        return NextResponse.json({ success: true, paid: true, membershipId: membership.id });
      }
      const existing = await fetchPayment(membership.paymentId).catch(() => null);
      if (existing?.payUrl) {
        return NextResponse.json({ success: true, membershipId: membership.id, payUrl: String(existing.payUrl) });
      }
      return NextResponse.json(
        { success: false, error: "This payment is already in progress. Please try again in a moment." },
        { status: 409 }
      );
    }

    const amount = Number(membership.pricePaid);

    /*
     * Nothing payable — a free plan. There is no gateway step to wait for, so it is settled
     * server-side by exactly the same confirmation path a card payment uses.
     */
    if (amount <= 0) {
      await confirmMembershipPaid(membership.id, { provider: "NONE", method: "FREE" });
      return NextResponse.json({ success: true, paid: true, membershipId: membership.id }, { status: 201 });
    }

    try {
      const payment = await createPayment({
        // The membership id is the gateway reference, so the payment can only ever be tied
        // back to this membership — never to an order.
        reference: membership.id,
        amount,
        customer: {
          firstName: user.firstName ?? undefined,
          lastName: user.lastName ?? undefined,
          email: user.email,
        },
      });
      await setMembershipPayment(membership.id, payment.paymentId);
      return NextResponse.json(
        { success: true, membershipId: membership.id, payUrl: payment.payUrl },
        { status: 201 }
      );
    } catch (e) {
      // The gateway refused or never answered. The membership stays inactive and unpaid, so
      // the customer is charged nothing and can simply try again.
      await setMembershipPaymentStatus(
        membership.id,
        "FAILED",
        e instanceof PaymentError ? e.message : "Could not start the payment"
      );
      throw e;
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: e.issues[0].message }, { status: 400 });
    }
    if (e instanceof MembershipError || e instanceof PaymentError) {
      return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    }
    console.error("[api/membership/subscribe]", e);
    return NextResponse.json({ success: false, error: "Failed to process subscription" }, { status: 500 });
  }
}
