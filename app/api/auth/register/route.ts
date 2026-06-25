import { NextResponse } from "next/server";
import { z } from "zod";
import { setOtp } from "@/lib/otpStore";

// In‑memory store for OTPs (email → { otp, expires })
// In a real app this would be persisted in DB or Redis.
const otpStore = new Map<string, { otp: string; expires: number }>();

// Zod schema for registration payload
const registerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * POST /api/auth/register
 * Creates a user with status "unverified" (placeholder) and sends a 6‑digit OTP.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { email } = parsed.data;

    // Generate 6‑digit OTP
    const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    setOtp(email, otp, expires);

    // Placeholder for sending email – just log
    console.log(`🟢 OTP for ${email}: ${otp} (expires in 10 minutes)`);

    // Respond with success – in a real app you would also create the user record
    return NextResponse.json({ message: "OTP sent to email" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
