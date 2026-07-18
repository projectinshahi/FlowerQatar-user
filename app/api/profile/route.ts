import { prisma } from "@/lib/prisma";
import { ok, fail, withUser, ApiError } from "@/lib/api";
import { updateProfileSchema } from "@/lib/validations/account";

const PROFILE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  profileImage: true,
  dateOfBirth: true,
  city: true,
  state: true,
  country: true,
  role: true,
  isEmailVerified: true,
} as const;

// GET /api/profile — the signed-in user's profile.
export const GET = withUser(async ({ user }) => {
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: PROFILE_SELECT });
  if (!profile) return fail("User not found", 404);
  return ok(profile);
});

// PUT /api/profile — update the signed-in user's own profile.
export const PUT = withUser(async ({ user, req }) => {
  const body = await req.json().catch(() => ({}));
  const data = updateProfileSchema.parse(body);

  // Enforce the unique-phone constraint with a friendly message (instead of a raw P2002).
  if (data.phone) {
    const dupe = await prisma.user.findFirst({
      where: { phone: data.phone, NOT: { id: user.id } },
      select: { id: true },
    });
    if (dupe) throw new ApiError("That phone number is already in use", 409);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      profileImage: data.profileImage,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    },
    select: PROFILE_SELECT,
  });

  return ok(updated);
});
