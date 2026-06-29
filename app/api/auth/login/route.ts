import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password, isAdminLogin } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive || user.isBlocked || user.isDeleted) {
      return NextResponse.json({ error: 'Account is deactivated or blocked' }, { status: 403 });
    }

    const hasAdminRole = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (isAdminLogin && !hasAdminRole) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    if (!isAdminLogin && hasAdminRole) {
      return NextResponse.json({ error: 'Admins cannot log in on the customer portal.' }, { status: 403 });
    }

    // Rate Limiting (Brute force protection)
    if (user.lockUntil && user.lockUntil > new Date()) {
      return NextResponse.json({ error: 'Account is temporarily locked. Try again later.' }, { status: 429 });
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      // Increment failed login attempts
      const attempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
      }
      await prisma.user.update({ where: { id: user.id }, data: updates });

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isEmailVerified) {
      return NextResponse.json({ error: 'Email not verified. Please verify your email first.', unverified: true }, { status: 403 });
    }

    // Login successful
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        lockUntil: null,
      },
    });

    // Generate JWT
    const token = generateToken({ userId: user.id, role: user.role });

    // Set HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
