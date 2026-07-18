import { ok, withUser } from "@/lib/api";
import { addressSchema } from "@/lib/validations/address";
import { getAddress, updateAddress, deleteAddress } from "@/lib/services/address";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/addresses/[id] — one address (owner only).
export const GET = withUser<Ctx>(async ({ user, ctx }) => {
  const { id } = await ctx.params;
  return ok(await getAddress(user.id, id));
});

// PUT /api/addresses/[id] — update an address (owner only).
export const PUT = withUser<Ctx>(async ({ user, req, ctx }) => {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const data = addressSchema.parse(body);
  return ok(await updateAddress(user.id, id, data));
});

// DELETE /api/addresses/[id] — delete an address; promotes a new default if needed.
export const DELETE = withUser<Ctx>(async ({ user, ctx }) => {
  const { id } = await ctx.params;
  return ok(await deleteAddress(user.id, id));
});
