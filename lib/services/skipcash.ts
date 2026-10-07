import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { confirmOrderPaid, setOrderPaymentStatus } from "@/lib/services/order";
import { confirmMembershipPaid, setMembershipPaymentStatus } from "@/lib/services/membership";

/**
 * SkipCash card payments — the ONE place that talks to the gateway.
 *
 * Contract per the official SkipCash developer documentation
 * (https://dev.skipcash.app/doc/api-integration/node/ and /php/) and the official
 * SkipCash WooCommerce plugin:
 *
 *   create   POST {base}/api/v1/payments
 *            Authorization: base64(HMAC-SHA256("Uid=…,KeyId=…,…,TransactionId=…", KEY SECRET))
 *            body: the same fields in camelCase, plus webhookUrl/returnUrl (NOT signed)
 *            → resultObj.id (payment id) + resultObj.payUrl (where the customer pays)
 *   verify   GET  {base}/api/v1/payments/{id}   Authorization: CLIENT ID
 *            → resultObj.statusId / amount / visaTransactionId
 *   webhook  Authorization: base64(HMAC-SHA256("PaymentId=…,Amount=…,…", WEBHOOK KEY)),
 *            empty fields skipped.
 *
 * Nothing here is ever sent to the browser: the key secret, the webhook key and the client id
 * stay in this process, and none of them is written to a log.
 */

const SANDBOX_URL = "https://skipcashtest.azurewebsites.net";
const PRODUCTION_URL = "https://api.skipcash.app";
const TIMEOUT_MS = 20_000;

/** SkipCash StatusId → our PaymentStatus. Any other value is deliberately NOT treated as paid. */
const STATUS_BY_ID: Record<number, "PENDING" | "PAID" | "CANCELLED" | "FAILED" | "REFUNDED"> = {
  // 0 ("new") is what the sandbox returns for a payment the customer has not attempted yet.
  0: "PENDING",
  1: "PENDING",
  2: "PAID",
  3: "CANCELLED",
  4: "FAILED",
  5: "REFUNDED",
};

/** Fields the webhook signature covers, in the documented order. Empty ones are skipped. */
const WEBHOOK_FIELDS = ["PaymentId", "Amount", "StatusId", "TransactionId", "Custom1", "VisaId"] as const;

export class PaymentError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "PaymentError";
    this.status = status;
  }
}

interface SkipCashConfig {
  baseUrl: string;
  keyId: string;
  keySecret: string;
  clientId: string;
}

/**
 * Sandbox unless SKIPCASH_ENV explicitly says production, so a missing or misspelt value can
 * never point test traffic at the live gateway. Switching to production is a .env change only.
 */
function config(): SkipCashConfig {
  const keyId = process.env.SKIPCASH_KEY_ID;
  const keySecret = process.env.SKIPCASH_KEY_SECRET;
  const clientId = process.env.SKIPCASH_CLIENT_ID;
  if (!keyId || !keySecret || !clientId) {
    throw new PaymentError("Card payment is not available right now. Please try again later.", 503);
  }
  const live = /^(prod|production|live)$/i.test(process.env.SKIPCASH_ENV ?? "");
  return { baseUrl: live ? PRODUCTION_URL : SANDBOX_URL, keyId, keySecret, clientId };
}

/**
 * The request signature: the payload's own fields, in payload order, as `Name=value` pairs
 * joined by commas, with the first letter of each name capitalised (`uid` → `Uid`).
 */
function signRequest(fields: Record<string, string>, keySecret: string): string {
  const signed = Object.entries(fields)
    .map(([key, value]) => `${key[0].toUpperCase()}${key.slice(1)}=${value}`)
    .join(",");
  return createHmac("sha256", keySecret).update(signed).digest("base64");
}

const clean = (value: string | null | undefined, max = 80) => (value ?? "").trim().slice(0, max);

/**
 * SkipCash wants an international number; a local Qatari one is accepted and normalised.
 *
 * Anything that is NOT a valid number is dropped rather than sent as-is. The gateway
 * validates this field and answers a bad one with a flat 400 "Invalid details!" naming
 * nothing, so a customer who typed a number from another country (a 10-digit one, say,
 * which is not a valid Qatari 8-digit number) could not pay at all - the entire payment
 * was refused over an optional field. Phone is optional to SkipCash: omitting it creates
 * the payment normally, and the number the customer gave is still recorded on the order.
 */
function normalizePhone(phone: string | null | undefined): string {
  const raw = clean(phone, 40);
  if (!raw) return "";
  const parsed = parsePhoneNumberFromString(raw, "QA");
  return parsed?.isValid() ? parsed.number : "";
}

export interface SkipCashPayment {
  id?: string;
  statusId?: number;
  status?: string;
  amount?: string | number;
  transactionId?: string;
  visaTransactionId?: string;
  payUrl?: string;
}

export interface PaymentCustomer {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/**
 * Create a hosted payment. Used for both an order and a membership purchase: `reference` is
 * our own id for whichever it is, and it travels to SkipCash as the transactionId so the
 * payment can be tied back to exactly that record when it returns.
 *
 * The amount is always SERVER-calculated — this function is never given a figure that came
 * from a browser.
 */
export async function createPayment(input: {
  reference: string;
  amount: number;
  customer: PaymentCustomer;
}): Promise<{ paymentId: string; payUrl: string }> {
  const { baseUrl, keyId, keySecret } = config();

  // SkipCash requires both names; fall back to whichever one the customer gave.
  const firstName = clean(input.customer.firstName) || clean(input.customer.lastName);
  const lastName = clean(input.customer.lastName) || firstName;
  const email = clean(input.customer.email, 255);
  const phone = normalizePhone(input.customer.phone);
  if (!firstName) throw new PaymentError("A name is required to pay by card.");
  if (!email) throw new PaymentError("An email address is required to pay by card.");

  // Insertion order IS the signature order.
  const fields: Record<string, string> = {
    uid: randomUUID(),
    keyId,
    amount: input.amount.toFixed(2),
    firstName,
    lastName,
  };
  if (phone) fields.phone = phone;
  fields.email = email;
  fields.transactionId = input.reference;

  const authorization = signRequest(fields, keySecret);
  // Added after signing: the plugin signs the customer fields only.
  const body = {
    ...fields,
    webhookUrl: `${SITE_URL}/api/payments/skipcash/webhook`,
    returnUrl: `${SITE_URL}/api/payments/skipcash/return`,
  };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/payments`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    // Network failure or timeout — the customer keeps their cart and can retry.
    throw new PaymentError("The payment gateway did not respond. Please try again.", 502);
  }

  const json = (await response.json().catch(() => null)) as { resultObj?: SkipCashPayment; errorMessage?: string } | null;
  const result = json?.resultObj;
  if (!response.ok || !result?.id || !result?.payUrl) {
    // Only the gateway's own message and the HTTP status are logged — never the request
    // payload (customer details) and never the Authorization header.
    console.error("[skipcash] create payment failed", {
      reference: input.reference,
      httpStatus: response.status,
      error: json?.errorMessage ?? null,
    });
    throw new PaymentError(json?.errorMessage || "Could not start the card payment. Please try again.", 502);
  }
  return { paymentId: String(result.id), payUrl: String(result.payUrl) };
}

/** Ask SkipCash what actually happened to a payment. The only source of truth for PAID. */
export async function fetchPayment(paymentId: string): Promise<SkipCashPayment> {
  const { baseUrl, clientId } = config();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/payments/${encodeURIComponent(paymentId)}`, {
      method: "GET",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: clientId },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new PaymentError("Could not reach the payment gateway.", 502);
  }
  const json = (await response.json().catch(() => null)) as { resultObj?: SkipCashPayment } | null;
  if (!response.ok || !json?.resultObj) {
    console.error("[skipcash] verify failed", { paymentId, httpStatus: response.status });
    throw new PaymentError("Could not verify the payment.", 502);
  }
  return json.resultObj;
}

/**
 * Webhook authentication. Rebuilds the signed string from the payload the same way SkipCash
 * does and compares in constant time. No webhook key configured ⇒ nothing is ever accepted.
 */
export function verifyWebhookSignature(payload: Record<string, unknown>, signature: string | null | undefined): boolean {
  const webhookKey = process.env.SKIPCASH_WEBHOOK_KEY;
  if (!webhookKey || !signature) return false;

  const signed = WEBHOOK_FIELDS.filter((field) => {
    const value = payload[field];
    return value !== undefined && value !== null && String(value) !== "";
  })
    .map((field) => `${field}=${payload[field]}`)
    .join(",");

  const expected = Buffer.from(createHmac("sha256", webhookKey).update(signed).digest("base64"));
  const given = Buffer.from(String(signature));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export type PaymentKind = "PRODUCT" | "SUBSCRIPTION";

/** What a payment was created for, answered without asking the gateway anything. */
export interface PaymentOwner {
  kind: PaymentKind;
  orderId: string | null;
  membershipId: string | null;
  /** The plan, so a failed subscription payment can offer the right retry link. */
  planId: string | null;
  /** OUR figure for what this payment should be — never the browser's, never the gateway's. */
  amount: number;
  /** The reference we sent as transactionId when the payment was created. */
  reference: string;
}

export interface ConfirmResult {
  /** UNKNOWN = no such payment here, or a status SkipCash has not documented. Never paid. */
  status: "PAID" | "PENDING" | "FAILED" | "CANCELLED" | "REFUNDED" | "UNKNOWN";
  /** What the payment was for, or null when this payment belongs to nothing here. */
  kind: PaymentKind | null;
  orderId: string | null;
  membershipId?: string | null;
  planId?: string | null;
}

/**
 * Find what a payment belongs to. paymentId is unique on Order and on Membership, so it
 * resolves to exactly one of them — a product payment and a subscription payment can never be
 * mistaken for one another.
 */
export async function findPaymentOwner(paymentId: string): Promise<PaymentOwner | null> {
  const order = await prisma.order.findUnique({
    where: { paymentId },
    select: { id: true, totalAmount: true },
  });
  if (order) {
    return {
      kind: "PRODUCT",
      orderId: order.id,
      membershipId: null,
      planId: null,
      amount: Number(order.totalAmount),
      reference: order.id,
    };
  }

  const membership = await prisma.membership.findUnique({
    where: { paymentId },
    select: { id: true, planId: true, pricePaid: true },
  });
  if (membership) {
    return {
      kind: "SUBSCRIPTION",
      orderId: null,
      membershipId: membership.id,
      planId: membership.planId,
      amount: Number(membership.pricePaid),
      reference: membership.id,
    };
  }

  return null;
}

interface Verification {
  status: ConfirmResult["status"];
  statusId: unknown;
  /** The gateway's own transaction id, present only on a verified payment. */
  txnId: string | null;
  /** Set when SkipCash says PAID but the money or the reference does not match ours. */
  mismatch: string | null;
}

/**
 * The verification both payment types share: ask SkipCash what actually happened, map its
 * status, and check the money and the reference against our own record. Applies no effect of
 * its own — the caller decides what a verified payment means for an order or a membership.
 */
async function verifyAgainst(paymentId: string, expected: PaymentOwner): Promise<Verification> {
  const payment = await fetchPayment(paymentId);
  const status = STATUS_BY_ID[Number(payment.statusId)];

  // Undocumented status: report UNKNOWN rather than guess what it means.
  if (!status) {
    console.warn("[skipcash] unrecognised statusId", { paymentId, statusId: payment.statusId });
    return { status: "UNKNOWN", statusId: payment.statusId, txnId: null, mismatch: null };
  }
  if (status !== "PAID") {
    return { status, statusId: payment.statusId, txnId: null, mismatch: null };
  }

  const paid = Number(payment.amount);
  if (!Number.isFinite(paid) || Math.abs(paid - expected.amount) > 0.01) {
    return { status, statusId: payment.statusId, txnId: null, mismatch: "Paid amount does not match the amount due" };
  }
  if (payment.transactionId && String(payment.transactionId) !== expected.reference) {
    return { status, statusId: payment.statusId, txnId: null, mismatch: "Payment does not belong to this transaction" };
  }
  return {
    status,
    statusId: payment.statusId,
    txnId: payment.visaTransactionId ? String(payment.visaTransactionId) : null,
    mismatch: null,
  };
}

/**
 * THE payment confirmation path, for BOTH product orders and membership purchases. The return
 * URL and the webhook both call this and nothing else, so whichever arrives first (or both at
 * once) produces the same result:
 *
 *  1. find what this payment was created for,
 *  2. ask SkipCash what happened: a customer coming back from the gateway proves nothing,
 *  3. check the money and the reference match that record,
 *  4. hand over to the owning service, which applies the effects exactly once.
 */
export async function confirmSkipCashPayment(paymentId: string): Promise<ConfirmResult> {
  const owner = await findPaymentOwner(paymentId);
  if (!owner) return { status: "UNKNOWN", kind: null, orderId: null };

  const base = {
    kind: owner.kind,
    orderId: owner.orderId,
    membershipId: owner.membershipId,
    planId: owner.planId,
  };
  const result = await verifyAgainst(paymentId, owner);

  if (result.status === "UNKNOWN") return { status: "UNKNOWN", ...base };

  if (owner.kind === "PRODUCT") {
    const orderId = owner.orderId as string;
    if (result.status !== "PAID") {
      await setOrderPaymentStatus(orderId, result.status, `SkipCash status ${result.statusId}`);
      return { status: result.status, ...base };
    }
    if (result.mismatch) {
      console.error("[skipcash] verification failed", { paymentId, orderId, reason: result.mismatch });
      await setOrderPaymentStatus(orderId, "FAILED", result.mismatch);
      return { status: "FAILED", ...base };
    }
    await confirmOrderPaid(orderId, { provider: "SKIPCASH", paymentTxnId: result.txnId });
    return { status: "PAID", ...base };
  }

  const membershipId = owner.membershipId as string;
  if (result.status !== "PAID") {
    await setMembershipPaymentStatus(membershipId, result.status, `SkipCash status ${result.statusId}`);
    return { status: result.status, ...base };
  }
  if (result.mismatch) {
    console.error("[skipcash] verification failed", { paymentId, membershipId, reason: result.mismatch });
    await setMembershipPaymentStatus(membershipId, "FAILED", result.mismatch);
    return { status: "FAILED", ...base };
  }
  await confirmMembershipPaid(membershipId, { provider: "SKIPCASH", method: "CARD", paymentTxnId: result.txnId });
  return { status: "PAID", ...base };
}
