import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from '@/lib/session-cookie';

// Shape only - never the password policy. An existing account whose password predates the
// current rules must still be able to sign in; 72 is the bcrypt ceiling, not a strength rule.
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(254),
  password: z.string().min(1, 'Password is required').max(72),
  isAdminLogin: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    // Per-IP ceiling on attempts, on top of the per-account lock below.
    const limit = rateLimit(`login:${clientIp(req)}`, 20, 15 * 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      );
    }

    const parsed = loginSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const { email: normalizedEmail, password, isAdminLogin } = parsed.data;

    // Only the columns login uses — the row also carries the cart and address JSON.
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true, password: true, lockUntil: true, failedLoginAttempts: true, isActive: true, isBlocked: true,
        isDeleted: true, role: true, isEmailVerified: true, firstName: true, lastName: true, email: true, profileImage: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Rate Limiting (Brute force protection)
    if (user.lockUntil && user.lockUntil > new Date()) {
      return NextResponse.json({ error: 'Account is temporarily locked. Try again later.' }, { status: 429 });
    }

    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      // Increment failed login attempts
      const attempts = user.failedLoginAttempts + 1;
      const updates: Prisma.UserUpdateInput = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
      }
      await prisma.user.update({ where: { id: user.id }, data: updates });

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    /*
     * Account-state and portal checks run only AFTER the password is proven. They used to run
     * first, so anyone could learn which emails belong to admins, or to deactivated accounts,
     * without knowing a password.
     */
    if (!user.isActive || user.isBlocked || user.isDeleted) {
      return NextResponse.json({ error: 'Account is deactivated or blocked' }, { status: 403 });
    }

    const hasAdminRole = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    if (isAdminLogin && !hasAdminRole) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Same reply as a wrong password, so the customer login never reveals which emails are admins.
    if (!isAdminLogin && hasAdminRole) {
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
    cookieStore.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);

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
