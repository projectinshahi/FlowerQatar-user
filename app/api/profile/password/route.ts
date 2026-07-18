import { prisma } from "@/lib/prisma";
import { ok, withUser, ApiError } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validations/account";
import { verifyPassword, hashPassword } from "@/lib/auth";

// PUT /api/profile/password — change the signed-in user's own password.
export const PUT = withUser(async ({ user, req }) => {
  const body = await req.json().catch(() => ({}));
  const data = changePasswordSchema.parse(body);

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } });
  if (!dbUser?.password) {
    throw new ApiError("Your account has no password set. You signed in with a social provider.", 400);
  }

  const currentOk = await verifyPassword(data.currentPassword, dbUser.password);
  if (!currentOk) throw new ApiError("Your current password is incorrect", 400);

  const hash = await hashPassword(data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } });

  return ok({ updated: true });
});
