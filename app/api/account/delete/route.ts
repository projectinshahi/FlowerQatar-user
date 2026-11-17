import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ok, withUser, ApiError } from "@/lib/api";
import { verifyPassword } from "@/lib/auth";
import { deleteAccountSchema } from "@/lib/validations/privacy";
import { CUSTOMER_SESSION_COOKIE, SESSION_COOKIE_CLEARED } from "@/lib/session-cookie";

// POST /api/account/delete — GDPR account deletion (soft-delete + PII anonymization).
// Requires password confirmation (or email confirmation for social-only accounts).
export const POST = withUser(async ({ user, req }) => {
  const body = await req.json().catch(() => ({}));
  const { password, confirmText } = deleteAccountSchema.parse(body);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, password: true, isDeleted: true },
  });
  if (!dbUser || dbUser.isDeleted) throw new ApiError("Account not found", 404);

  // Confirm identity before destroying data.
  if (dbUser.password) {
    if (!password || !(await verifyPassword(password, dbUser.password))) {
      throw new ApiError("Your password is incorrect", 400);
    }
  } else {
    if (!confirmText || confirmText.trim().toLowerCase() !== dbUser.email.toLowerCase()) {
      throw new ApiError("Type your email address to confirm deletion", 400);
    }
  }

  const emptyArray = [] as unknown as Prisma.InputJsonValue;
  const emptyObject = {} as unknown as Prisma.InputJsonValue;

  await prisma.$transaction(async (tx) => {
    // Stop any active/paused subscriptions.
    await tx.subscription.updateMany({
      where: { userId: dbUser.id, status: { in: ["ACTIVE", "PAUSED"] } },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Account deleted" },
    });
    // Soft-delete + scrub personal data. Orders are retained (legal/accounting) but reference an anonymized user.
    await tx.user.update({
      where: { id: dbUser.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
        email: `deleted+${dbUser.id}@deleted.invalid`,
        firstName: null,
        lastName: null,
        phone: null,
        profileImage: null,
        dateOfBirth: null,
        country: null,
        state: null,
        city: null,
        password: null,
        providerId: null,
        addresses: emptyArray,
        cart: emptyArray,
        consent: emptyObject,
      },
    });
  });

  // Invalidate the customer session.
  const jar = await cookies();
  jar.set(CUSTOMER_SESSION_COOKIE, "", SESSION_COOKIE_CLEARED);

  return ok({ deleted: true });
});
