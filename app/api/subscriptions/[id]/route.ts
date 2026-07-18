import { ok, withUser } from "@/lib/api";
import { getSubscription } from "@/lib/services/subscription/service";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/subscriptions/[id] — one subscription with deliveries + history (owner only).
export const GET = withUser<Ctx>(async ({ user, ctx }) => {
  const { id } = await ctx.params;
  return ok(await getSubscription(user.id, id));
});
