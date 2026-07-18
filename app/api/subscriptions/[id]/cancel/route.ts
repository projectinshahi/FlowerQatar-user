import { ok, withUser } from "@/lib/api";
import { cancelSubscriptionSchema } from "@/lib/validations/subscription";
import { cancelSubscription } from "@/lib/services/subscription/service";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/subscriptions/[id]/cancel — cancel the subscription + all future deliveries.
export const PATCH = withUser<Ctx>(async ({ user, req, ctx }) => {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const data = cancelSubscriptionSchema.parse(body);
  return ok(await cancelSubscription(user.id, id, data));
});
