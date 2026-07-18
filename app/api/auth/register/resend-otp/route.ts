import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resendOtpSchema } from "@/lib/validations/register";
import { createEmailOtp, recentOtpCount, secondsUntilResendAllowed } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/register/resend-otp
 * Generates a new OTP (invalidating the previous one) and re-sends the email, subject to
 * per-IP and per-email caps.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limit = rateLimit(`resend-otp:${ip}`, 8, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const parsed = resendOtpSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { email, firstName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "This email address is already registered." }, { status: 409 });
    }

    // Server-side cooldown: refuse a resend within 60s of the previous code.
    const wait = await secondsUntilResendAllowed(email, "REGISTER");
    if (wait > 0) {
      return NextResponse.json(
        { error: `Please wait ${wait} second${wait === 1 ? "" : "s"} before requesting a new code.`, retryAfter: wait },
        { status: 429 }
      );
    }

    if ((await recentOtpCount(email, "REGISTER")) >= 6) {
      return NextResponse.json({ error: "Too many codes requested. Please try again later." }, { status: 429 });
    }

    const code = await createEmailOtp(email, "REGISTER");
    await sendOtpEmail(email, firstName || "there", code);

    return NextResponse.json({ success: true, message: "A new verification code has been sent." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("resend-otp error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
