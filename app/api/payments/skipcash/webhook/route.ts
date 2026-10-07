import { NextResponse } from "next/server";
import { confirmSkipCashPayment, verifyWebhookSignature } from "@/lib/services/skipcash";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/skipcash/webhook
 *
 * SkipCash's server-to-server notification for BOTH product orders and membership
 * purchases. Authenticated by the signature in the
 * Authorization header, which is rebuilt from the payload with the webhook key: no valid
 * signature, nothing happens. Even then the payload is only used to learn WHICH payment
 * changed — what actually happened is read back from the SkipCash API by
 * confirmSkipCashPayment(), the same path the customer's return uses, so a duplicate
 * delivery or a race with the return cannot apply anything twice.
 *
 * The body carries card data, so it is never logged.
 */
export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!verifyWebhookSignature(payload, request.headers.get("authorization"))) {
    console.warn("[skipcash] webhook rejected: bad signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const paymentId = payload.PaymentId ? String(payload.PaymentId) : "";
  if (!paymentId) {
    return NextResponse.json({ error: "Missing PaymentId" }, { status: 400 });
  }

  try {
    const result = await confirmSkipCashPayment(paymentId);
    return NextResponse.json({ received: true });
  } catch (e) {
    // Could not verify with SkipCash right now — 503 so the gateway delivers it again.
    console.error("[skipcash] webhook verification failed", { paymentId, error: (e as Error).message });
    return NextResponse.json({ error: "Verification failed" }, { status: 503 });
  }
}
