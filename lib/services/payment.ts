import { randomUUID } from "crypto";

/**
 * Payment abstraction. The subscription flow depends ONLY on this interface — swapping the
 * simulated gateway for a real one (Razorpay/Stripe) later means implementing `charge()`
 * and changing the single `paymentGateway` export below; the subscribe flow is untouched.
 */

export type PaymentStatus = "SUCCESS" | "FAILED";

export interface PaymentResult {
  status: PaymentStatus;
  gateway: string; // e.g. "SIMULATED" | "RAZORPAY"
  method: string; // e.g. "DEVELOPMENT" | "CARD"
  transactionId: string;
}

export interface ChargeInput {
  amount: number;
  currency: string; // e.g. "QAR"
  reference: string; // our own reference (idempotency key / plan)
}

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<PaymentResult>;
}

/**
 * Development gateway: no external calls, no keys, always succeeds. Produces an internal
 * simulated payment record (SUCCESS / DEVELOPMENT / SIMULATED + a UUID transaction id).
 * The transaction id is generated on the SERVER, so there is no browser secure-context
 * requirement (unlike `crypto.randomUUID()` on the client).
 */
export const simulatedGateway: PaymentGateway = {
  async charge(): Promise<PaymentResult> {
    return {
      status: "SUCCESS",
      gateway: "SIMULATED",
      method: "DEVELOPMENT",
      transactionId: `sim_${randomUUID()}`,
    };
  },
};

/**
 * The active gateway. Replace this line with the real gateway when integrating
 * (e.g. `export const paymentGateway = razorpayGateway;`).
 */
export const paymentGateway: PaymentGateway = simulatedGateway;
