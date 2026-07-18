import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { OtpPurpose } from "@prisma/client";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000; // minimum gap between OTP sends per (email, purpose)

/** Cryptographically secure numeric OTP (uses crypto.randomInt). */
export function generateNumericOtp(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) code += crypto.randomInt(0, 10).toString();
  return code;
}

const normalize = (email: string) => email.toLowerCase().trim();

/**
 * Creates a fresh OTP for (email, purpose), invalidating any previous unused ones,
 * and opportunistically cleans up long-expired rows. Returns the PLAINTEXT code
 * (only ever emailed — the DB stores a bcrypt hash).
 */
export async function createEmailOtp(email: string, purpose: OtpPurpose): Promise<string> {
  const em = normalize(email);
  await prisma.$transaction([
    prisma.emailOTP.updateMany({ where: { email: em, purpose, isUsed: false }, data: { isUsed: true } }),
    // Opportunistic cleanup of rows expired more than a day ago.
    prisma.emailOTP.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);

  const code = generateNumericOtp(6);
  const hash = await bcrypt.hash(code, 10);
  await prisma.emailOTP.create({
    data: { email: em, otp: hash, purpose, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  return code;
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "USED" | "EXPIRED" | "ATTEMPTS" | "INVALID"; message: string };

/** Verifies a code against the latest OTP for (email, purpose). Marks it used on success. */
export async function verifyEmailOtp(email: string, purpose: OtpPurpose, code: string): Promise<OtpVerifyResult> {
  const em = normalize(email);
  const rec = await prisma.emailOTP.findFirst({
    where: { email: em, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!rec) return { ok: false, code: "NOT_FOUND", message: "No verification code found. Please request a new one." };
  if (rec.isUsed) return { ok: false, code: "USED", message: "This verification code has already been used." };
  if (rec.expiresAt < new Date()) return { ok: false, code: "EXPIRED", message: "Your verification code has expired." };
  if (rec.attempts >= MAX_ATTEMPTS)
    return { ok: false, code: "ATTEMPTS", message: "Too many attempts. Please request a new code." };

  const match = await bcrypt.compare(code, rec.otp);
  if (!match) {
    await prisma.emailOTP.update({ where: { id: rec.id }, data: { attempts: { increment: 1 } } });
    return { ok: false, code: "INVALID", message: "Invalid verification code." };
  }

  await prisma.emailOTP.update({ where: { id: rec.id }, data: { isUsed: true } });
  return { ok: true };
}

/**
 * Seconds a caller must still wait before another OTP may be sent for (email, purpose).
 * Returns 0 when a new code is allowed now. Enforces the resend cooldown server-side
 * (the client countdown is only a hint and can be bypassed).
 */
export async function secondsUntilResendAllowed(email: string, purpose: OtpPurpose): Promise<number> {
  const last = await prisma.emailOTP.findFirst({
    where: { email: normalize(email), purpose },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!last) return 0;
  const remaining = RESEND_COOLDOWN_MS - (Date.now() - last.createdAt.getTime());
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/** Number of OTPs created for (email, purpose) within the window — used to cap resends. */
export async function recentOtpCount(email: string, purpose: OtpPurpose, windowMs = 60 * 60 * 1000): Promise<number> {
  return prisma.emailOTP.count({
    where: { email: normalize(email), purpose, createdAt: { gt: new Date(Date.now() - windowMs) } },
  });
}

/** Removes all OTP rows for (email, purpose) — called after successful account creation. */
export async function clearEmailOtps(email: string, purpose: OtpPurpose): Promise<void> {
  await prisma.emailOTP.deleteMany({ where: { email: normalize(email), purpose } });
}
