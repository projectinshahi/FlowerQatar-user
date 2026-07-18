import { ok, withUser } from "@/lib/api";
import { resumeSubscription } from "@/lib/services/subscription/service";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/subscriptions/[id]/resume
export const PATCH = withUser<Ctx>(async ({ user, ctx }) => {
  const { id } = await ctx.params;
  return ok(await resumeSubscription(user.id, id));
});
