import { z } from "zod";

/**
 * POST /api/membership/subscribe — start a membership purchase.
 *
 * The plan is all the browser sends: the price comes from the plan row and the payment outcome
 * comes from SkipCash, read back server-side. Neither can be supplied by the client.
 */
export const subscribeSchema = z.object({
  planId: z.string().uuid("Invalid plan"),
  // Anti-replay: a client-generated key that makes the call idempotent.
  idempotencyKey: z.string().min(8, "Invalid request key").max(100),
});
