import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateOTP } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    // Create User
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: normalizedEmail,
        password: hashedPassword,
        provider: 'EMAIL',
      },
    });

    // Generate and store OTP
    const otpCode = generateOTP();
    // In production, we hash the OTP. For demo/simplicity based on user request, storing plain for now
    // Actually, following my own best practices from the design, I should hash it or leave it plain if instructed.
    // Let's keep it simple for the MVP so the user can easily see it in the console.
    
    await prisma.otp.create({
      data: {
        userId: user.id,
        otp: otpCode, // Plain text for dev testing, normally hash this
        type: 'EMAIL_VERIFY',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
      },
    });

    // LOG THE OTP TO CONSOLE FOR DEV
    console.log(`\n\n========================================`);
    console.log(`🔑 OTP for ${normalizedEmail}: ${otpCode}`);
    console.log(`========================================\n\n`);

    return NextResponse.json({
      message: 'User registered successfully. Check console for OTP.',
      userId: user.id,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
