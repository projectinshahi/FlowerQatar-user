import { z } from "zod";

/** Simulated payment outcome from the payment page (never trusted as proof of payment). */
export const PAYMENT_OUTCOMES = ["SUCCESS", "FAILED"] as const;

/** POST /api/membership/subscribe — subscribe to a plan via simulated payment. */
export const subscribeSchema = z.object({
  planId: z.string().uuid("Invalid plan"),
  outcome: z.enum(PAYMENT_OUTCOMES),
  // Anti-replay: a client-generated key that makes the call idempotent.
  idempotencyKey: z.string().min(8, "Invalid request key").max(100),
});
export type SubscribeInput = z.infer<typeof subscribeSchema>;

/** Base redemption fields — points to redeem against an order of `orderTotal`. */
export const redeemPreviewSchema = z.object({
  points: z
    .number({ error: "Points must be a number" })
    .int("Points must be a whole number")
    .min(0, "Points cannot be negative"),
  orderTotal: z.number({ error: "Order total is required" }).min(0, "Invalid order total"),
});
export type RedeemPreviewInput = z.infer<typeof redeemPreviewSchema>;

/** POST /api/checkout/redeem — commit a redemption at order placement. */
export const redeemSchema = redeemPreviewSchema.extend({
  reference: z.string().max(100).optional(),
});
export type RedeemInput = z.infer<typeof redeemSchema>;
