import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validations/register";
import { clearEmailOtps, verifyEmailOtp } from "@/lib/otp";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/forgot-password/reset  { email, otp, password, confirmPassword }
 * Verifies the emailed code and sets the new password.
 *
 * Also clears any login lockout (a customer locked out after wrong passwords is exactly who
 * resets) and marks the email verified — receiving the code proves they own the inbox. The
 * customer then signs in with the new password; no session is created here.
 */
export async function POST(req: Request) {
  try {
    const limit = rateLimit(`reset-verify:${clientIp(req)}`, 20, 15 * 60 * 1000); // 20 per 15 min per IP
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { email, otp, password } = parsed.data;

    // Wrong code, expired, used, or too many tries: each has its own message from lib/otp.
    const check = await verifyEmailOtp(email, "PASSWORD_RESET", otp);
    if (!check.ok) {
      return NextResponse.json({ error: check.message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true, isBlocked: true, isDeleted: true },
    });
    if (!user || !user.isActive || user.isBlocked || user.isDeleted) {
      return NextResponse.json(
        { error: "This reset code is no longer valid. Please request a new one." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(password),
        failedLoginAttempts: 0,
        lockUntil: null,
        isEmailVerified: true,
      },
    });
    await clearEmailOtps(email, "PASSWORD_RESET");

    return NextResponse.json({ success: true, message: "Your password has been reset. Please sign in." });
  } catch (error) {
    console.error("forgot-password reset error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
