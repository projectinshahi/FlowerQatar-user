import { NextResponse } from "next/server";
import { z } from "zod";
import { setOtp, otpStore, verifyOtp, deleteOtp } from "@/lib/otpStore";

// Zod schema for verification payload
const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

/**
 * POST /api/auth/verify-otp
 * Checks OTP validity and marks user as verified (placeholder).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email, otp } = parsed.data;
    const stored = otpStore.get(email);
    if (!stored) {
      return NextResponse.json({ error: "No OTP found for this email" }, { status: 404 });
    }
    if (Date.now() > stored.expires) {
      deleteOtp(email);
      return NextResponse.json({ error: "OTP expired" }, { status: 410 });
    }
    if (stored.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }
    // OTP is valid – in real app update user status to verified.
    deleteOtp(email);
    return NextResponse.json({ message: "Verification successful" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
