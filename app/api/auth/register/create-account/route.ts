import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAccountSchema } from "@/lib/validations/register";
import { hashPassword, verifyScopedToken } from "@/lib/auth";
import { clearEmailOtps } from "@/lib/otp";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * POST /api/auth/register/create-account
 * Final step: validates the password, verifies the register-verified token (proof the
 * email OTP was confirmed), creates the User with emailVerified=true, and clears OTPs.
 * The account is created ONLY here — no unverified users ever exist.
 */
export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limit = rateLimit(`create-account:${ip}`, 10, 60 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const parsed = createAccountSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { token, firstName, lastName, password } = parsed.data;

    // The email is taken from the signed token, not the client — this is the authoritative,
    // verified email.
    const payload = verifyScopedToken<{ email?: string; scope?: string }>(token);
    if (!payload || payload.scope !== "register-verified" || !payload.email) {
      return NextResponse.json(
        { error: "Your verification has expired. Please start again." },
        { status: 401 }
      );
    }
    const email = payload.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "This email address is already registered." }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashed,
        provider: "EMAIL",
        isEmailVerified: true,
      },
      select: { id: true },
    });

    await clearEmailOtps(email, "REGISTER");

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("create-account error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
