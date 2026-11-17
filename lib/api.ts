import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, getCurrentUser, type AuthUser } from "@/lib/admin-guard";
import { getCurrentCustomer, type CustomerUser } from "@/lib/customer-guard";

/** Expected, client-safe errors thrown by services (business-rule violations, not-found, etc.). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Standard success envelope. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/** Standard error envelope. Never leak internal details to the client. */
export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error: message, ...extra }, { status });
}

/**
 * Wraps a route handler with centralized auth + error handling.
 *
 * - Loads the signed-in user (custom JWT session) and passes it to `handler`.
 * - Maps AuthError -> 401/403, ZodError -> 422 (with field messages), everything
 *   else -> 500 with a generic message (internal errors are logged, never exposed).
 */
// Ctx defaults to `any` so both param and non-param route handlers satisfy Next's
// generated route-type checks (framework boundary).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withUser<Ctx = any>(
  handler: (args: { user: AuthUser; req: Request; ctx: Ctx }) => Promise<Response>
) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      // Reject oversized payloads early (our JSON APIs are small; uploads go direct to Cloudinary).
      const len = Number(req.headers.get("content-length") || 0);
      if (len > MAX_BODY_BYTES) return fail("Request payload too large", 413);

      const user = await getCurrentUser();
      if (!user) return fail("You must be signed in", 401);
      return await handler({ user, req, ctx });
    } catch (e) {
      return mapError(e);
    }
  };
}

/**
 * Wraps a route handler requiring customer authentication + error handling.
 * Uses the CUSTOMER session, never the ADMIN session.
 *
 * - Loads the signed-in customer and passes it to `handler`.
 * - Maps ZodError -> 422 (with field messages), everything
 *   else -> 500 with a generic message (internal errors are logged, never exposed).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withCustomer<Ctx = any>(
  handler: (args: { user: CustomerUser; req: Request; ctx: Ctx }) => Promise<Response>
) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    try {
      // Reject oversized payloads early (our JSON APIs are small; uploads go direct to Cloudinary).
      const len = Number(req.headers.get("content-length") || 0);
      if (len > MAX_BODY_BYTES) return fail("Request payload too large", 413);

      const user = await getCurrentCustomer();
      if (!user) return fail("You must be signed in", 401);
      return await handler({ user, req, ctx });
    } catch (e) {
      return mapError(e);
    }
  };
}

/** Max accepted JSON request body (1 MB) — guards against oversized-payload abuse. */
export const MAX_BODY_BYTES = 1_000_000;

export function mapError(e: unknown) {
  if (e instanceof AuthError) return fail(e.message, e.status);
  if (e instanceof ApiError) return fail(e.message, e.status);
  if (e instanceof ZodError) {
    const first = e.issues[0]?.message || "Invalid input";
    const fieldErrors: Record<string, string> = {};
    for (const issue of e.issues) {
      const key = issue.path.join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return fail(first, 422, { fieldErrors });
  }
  console.error("[api] Unhandled route error:", e);
  return fail("Something went wrong. Please try again.", 500);
}
