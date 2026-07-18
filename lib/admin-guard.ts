import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export interface AuthUser {
  id: string;
  role: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Reads the `session` cookie, verifies the JWT and loads the user.
 * Returns null when there is no valid, active session.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      role: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      isBlocked: true,
      isDeleted: true,
    },
  });

  if (!user || !user.isActive || user.isBlocked || user.isDeleted) return null;

  return {
    id: user.id,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/** Requires any authenticated (logged-in) user. Throws AuthError otherwise. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("You must be signed in", 401);
  return user;
}

/** Requires an ADMIN or SUPER_ADMIN. Throws AuthError otherwise. */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("You must be signed in", 401);
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new AuthError("Admin access required", 403);
  }
  return user;
}

/**
 * Route-handler guard: returns a NextResponse (401/403) to short-circuit the
 * handler when the caller is not an admin, or null when access is granted.
 * Usage:  const denied = await guardAdmin(); if (denied) return denied;
 */
export async function guardAdmin(): Promise<NextResponse | null> {
  try {
    await requireAdmin();
    return null;
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    const message = e instanceof AuthError ? e.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status });
  }
}

/** Route-handler guard for any authenticated user. Returns null when allowed. */
export async function guardUser(): Promise<NextResponse | null> {
  try {
    await requireUser();
    return null;
  } catch (e) {
    const status = e instanceof AuthError ? e.status : 401;
    const message = e instanceof AuthError ? e.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status });
  }
}
