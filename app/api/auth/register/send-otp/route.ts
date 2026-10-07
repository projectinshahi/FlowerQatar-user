import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendOtpSchema } from "@/lib/validations/register";
import { createEmailOtp, recentOtpCount } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/register/send-otp
 * Validates name/email, blocks duplicates, generates + stores a hashed OTP, and emails it.
 * No User row is created here — the account only exists after OTP verification + password.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limit = rateLimit(`send-otp:${ip}`, 8, 60 * 60 * 1000); // 8/hour per IP
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const parsed = sendOtpSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { firstName, email } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "This email address is already registered." }, { status: 409 });
    }

    // Per-email cap to prevent abuse of a single inbox.
    if ((await recentOtpCount(email, "REGISTER")) >= 6) {
      return NextResponse.json({ error: "Too many codes requested. Please try again later." }, { status: 429 });
    }

    const code = await createEmailOtp(email, "REGISTER");
    await sendOtpEmail(email, firstName, code);

    return NextResponse.json({ success: true, message: "Verification code sent to your email." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("send-otp error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
