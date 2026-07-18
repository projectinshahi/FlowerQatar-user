import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

/**
 * Logged-out response: 200 with a null user.
 *
 * Checking "is anyone signed in?" is not an error when the answer is "no" — so a guest
 * gets 200, not 401. (A 401 here made the browser log a console error on every page load
 * for signed-out visitors.) When a stale/invalid session cookie is present we also clear
 * it so it stops being re-sent on subsequent requests.
 */
function guest(clearCookie = false) {
  const res = NextResponse.json({ user: null });
  if (clearCookie) res.cookies.delete('session');
  return res;
}

export async function GET() {
  try {
    const token = (await cookies()).get('session')?.value;
    if (!token) return guest();

    const payload = verifyToken(token);
    if (!payload?.userId) return guest(true); // expired / tampered → drop the stale cookie

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        country: true,
        role: true,
        profileImage: true,
        isEmailVerified: true,
        isActive: true,
      },
    });

    // No such user (deleted) or deactivated account → treat as signed out, clear the session.
    if (!user || !user.isActive) return guest(true);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth Me Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
