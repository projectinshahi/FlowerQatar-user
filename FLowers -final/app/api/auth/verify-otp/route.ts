import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the latest unverified OTP for this user
    const otpRecord = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFY',
        verified: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json({ error: 'No OTP found for this user' }, { status: 400 });
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ error: 'Maximum attempts reached. Please request a new OTP.' }, { status: 400 });
    }

    if (otpRecord.otp !== otp) {
      await prisma.otp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // Mark OTP as verified and user as email verified
    await prisma.$transaction([
      prisma.otp.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      }),
    ]);

    return NextResponse.json({ message: 'Email verified successfully' });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
