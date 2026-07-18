import { ok, withUser } from "@/lib/api";
import { skipDeliverySchema } from "@/lib/validations/subscription";
import { skipDelivery } from "@/lib/services/subscription/service";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/subscriptions/[id]/skip — skip the next (or a specific) upcoming delivery.
export const PATCH = withUser<Ctx>(async ({ user, req, ctx }) => {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const data = skipDeliverySchema.parse(body);
  return ok(await skipDelivery(user.id, id, data));
});
