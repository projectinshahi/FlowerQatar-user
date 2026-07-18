import { ok, withUser } from "@/lib/api";
import { setDefaultAddress } from "@/lib/services/address";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/addresses/[id]/default — make this address the single default (owner only).
export const PATCH = withUser<Ctx>(async ({ user, ctx }) => {
  const { id } = await ctx.params;
  return ok(await setDefaultAddress(user.id, id));
});
