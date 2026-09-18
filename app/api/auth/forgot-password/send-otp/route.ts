import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/register";
import { createEmailOtp, recentOtpCount, secondsUntilResendAllowed } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/forgot-password/send-otp  { email }
 * Emails a 6-digit password-reset code (stored bcrypt-hashed, valid 5 minutes).
 *
 * Answers with the SAME message whether or not the address has an account. A different reply
 * for unknown emails would let anyone test which addresses are registered. The code is only
 * generated and sent when there is an active account behind the address, and silently skipped
 * inside the 60-second resend cooldown or past the hourly per-inbox cap — still with the same
 * reply, so those limits can't be used to probe for accounts either.
 */
const SENT = "If an account exists for this email, we have sent a reset code to it.";

export async function POST(req: Request) {
  try {
    const limit = rateLimit(`reset-send:${clientIp(req)}`, 8, 60 * 60 * 1000); // 8/hour per IP
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const parsed = forgotPasswordSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { firstName: true, isActive: true, isBlocked: true, isDeleted: true },
    });

    if (user && user.isActive && !user.isBlocked && !user.isDeleted) {
      const [waitSeconds, sentThisHour] = await Promise.all([
        secondsUntilResendAllowed(email, "PASSWORD_RESET"),
        recentOtpCount(email, "PASSWORD_RESET"),
      ]);
      if (waitSeconds === 0 && sentThisHour < 6) {
        const code = await createEmailOtp(email, "PASSWORD_RESET");
        await sendOtpEmail(email, user.firstName ?? "", code, "reset");
      }
    }

    return NextResponse.json({ success: true, message: SENT });
  } catch (error) {
    console.error("forgot-password send-otp error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
