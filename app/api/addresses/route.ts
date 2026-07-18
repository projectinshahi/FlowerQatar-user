import { ok, withUser } from "@/lib/api";
import { addressSchema } from "@/lib/validations/address";
import { listAddresses, createAddress } from "@/lib/services/address";

// GET /api/addresses — all addresses for the signed-in user.
export const GET = withUser(async ({ user }) => {
  return ok(await listAddresses(user.id));
});

// POST /api/addresses — create a new address (enforces max limit + single default).
export const POST = withUser(async ({ user, req }) => {
  const body = await req.json().catch(() => ({}));
  const data = addressSchema.parse(body);
  const created = await createAddress(user.id, data);
  return ok(created, 201);
});
