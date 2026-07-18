import { ok, withUser } from "@/lib/api";
import { pauseSubscriptionSchema } from "@/lib/validations/subscription";
import { pauseSubscription } from "@/lib/services/subscription/service";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/subscriptions/[id]/pause
export const PATCH = withUser<Ctx>(async ({ user, req, ctx }) => {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const data = pauseSubscriptionSchema.parse(body);
  return ok(await pauseSubscription(user.id, id, data));
});
