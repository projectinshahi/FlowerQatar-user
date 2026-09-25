import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";
import { confirmSkipCashPayment, findPaymentOwner } from "@/lib/services/skipcash";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/skipcash/return?id=<paymentId>
 *
 * Where SkipCash sends the customer's browser when they are done — for a product order and for
 * a membership purchase alike. Coming back here is not proof of anything, so the payment is
 * verified against the SkipCash API by exactly the same code the webhook uses: whichever
 * arrives first settles it and the other one is a no-op. Then the customer lands on the
 * existing screen for whatever they were paying for.
 */
export async function GET(request: Request) {
  const paymentId = new URL(request.url).searchParams.get("id");
  const to = (path: string) => NextResponse.redirect(`${SITE_URL}${path}`, { status: 303 });
  const checkout = (params: string) => to(`/checkout?${params}`);
  /*
   * An unsuccessful card payment gets its own page rather than a toast on the checkout
   * form, which vanished after a few seconds and explained nothing. Mirrors the
   * membership side, which has had /membership/failed all along.
   */
  const orderFailed = (state: 'failed' | 'pending', orderId?: string | null) =>
    to(`/checkout/failed?state=${state}${orderId ? `&order=${orderId}` : ''}`);
  const membershipFailed = (planId?: string | null) =>
    to(planId ? `/membership/failed?plan=${planId}` : "/membership/failed");

  if (!paymentId) return orderFailed("failed");

  try {
    const result = await confirmSkipCashPayment(paymentId);

    if (result.kind === "SUBSCRIPTION") {
      /*
       * Only a verified payment reaches the success page; a payment still pending at the
       * gateway has activated nothing, so it lands on the existing failed page, which offers
       * a retry for the same plan. If the webhook settles it afterwards, the membership
       * activates on its own and shows up in the customer's account.
       */
      return result.status === "PAID" && result.membershipId
        ? to(`/membership/success?m=${result.membershipId}`)
        : membershipFailed(result.planId);
    }

    if (result.status === "PAID" && result.orderId) {
      return checkout(`order=${result.orderId}&payment=success`);
    }
    // Still pending at the gateway: the webhook will finish it. Everything else failed or was
    // cancelled — either way the cart, the points and the coupon are untouched.
    const state = result.status === "PENDING" ? "pending" : "failed";
    return orderFailed(state, result.orderId);
  } catch (e) {
    // Could not reach SkipCash. Nothing is assumed about the money; the webhook still settles
    // it. The customer is sent back to the screen they were paying from, which needs one more
    // lookup because the verification that would have told us never happened.
    console.error("[skipcash] return verification failed", { paymentId, error: (e as Error).message });
    const owner = await findPaymentOwner(paymentId).catch(() => null);
    return owner?.kind === "SUBSCRIPTION" ? membershipFailed(owner.planId) : orderFailed("pending", owner?.orderId);
  }
}
