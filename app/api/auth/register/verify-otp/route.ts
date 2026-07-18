import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtpSchema } from "@/lib/validations/register";
import { verifyEmailOtp } from "@/lib/otp";
import { signScopedToken } from "@/lib/auth";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/register/verify-otp
 * Verifies the code (correct / not expired / not used / attempts). On success returns a
 * short-lived signed token proving the email was verified — required by create-account.
 * Does NOT create a user.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limit = rateLimit(`verify-otp:${ip}`, 20, 15 * 60 * 1000); // 20 / 15min per IP
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const parsed = verifyOtpSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { email, otp } = parsed.data;

    // Guard against a race where the email got registered meanwhile.
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "This email address is already registered." }, { status: 409 });
    }

    const result = await verifyEmailOtp(email, "REGISTER", otp);
    if (!result.ok) {
      // Expired/used should be actionable (offer resend) → 410/409; invalid → 400.
      const status = result.code === "EXPIRED" ? 410 : result.code === "USED" ? 409 : 400;
      return NextResponse.json({ error: result.message, code: result.code }, { status });
    }

    const token = signScopedToken({ email, scope: "register-verified" }, "15m");
    return NextResponse.json({ success: true, token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("verify-otp error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
