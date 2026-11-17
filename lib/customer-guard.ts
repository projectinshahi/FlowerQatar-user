import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/session-cookie";
import { retryOnUnreachable } from "@/lib/prisma-error";

export interface CustomerUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
}

/**
 * Reads ONLY the customer session cookie, never the admin cookie.
 * Returns null when there is no valid, active customer session.
 */
export const getCurrentCustomer = cache(loadCurrentCustomer);

/**
 * The customer user id from the signed session cookie.
 * Customer sessions must NEVER use the admin cookie.
 */
export async function getCustomerSessionUserId(): Promise<string | null> {
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  return (token && verifyToken(token)?.userId) || null;
}

/**
 * Loads the customer user. Never loads admin users.
 * Customer authentication is completely separate from admin authentication.
 */
async function loadCurrentCustomer(): Promise<CustomerUser | null> {
  const userId = await getCustomerSessionUserId();
  if (!userId) return null;

  const user = await retryOnUnreachable(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        isActive: true,
        isBlocked: true,
        isDeleted: true,
      },
    })
  );

  if (!user || !user.isActive || user.isBlocked || user.isDeleted) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImage: user.profileImage,
  };
}
