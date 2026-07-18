import { ok, withUser } from "@/lib/api";
import { createSubscriptionSchema } from "@/lib/validations/subscription";
import { listSubscriptions, createSubscription } from "@/lib/services/subscription/service";

// GET /api/subscriptions — the signed-in user's subscriptions.
export const GET = withUser(async ({ user }) => {
  return ok(await listSubscriptions(user.id));
});

// POST /api/subscriptions — create a new subscription (generates the delivery schedule).
export const POST = withUser(async ({ user, req }) => {
  const body = await req.json().catch(() => ({}));
  const data = createSubscriptionSchema.parse(body);
  return ok(await createSubscription(user.id, data), 201);
});
