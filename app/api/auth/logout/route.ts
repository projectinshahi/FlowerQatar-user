import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE, CUSTOMER_SESSION_COOKIE, SESSION_COOKIE_CLEARED, SESSION_COOKIE } from '@/lib/session-cookie';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Clear whichever session exists (admin or customer or both).
    // Set an expired cookie rather than delete(): a Set-Cookie only replaces a cookie with the
    // same name, domain and path, and delete() carries none of those attributes.
    const hasAdminSession = cookieStore.has(ADMIN_SESSION_COOKIE);
    const hasCustomerSession = cookieStore.has(CUSTOMER_SESSION_COOKIE);

    if (hasAdminSession) {
      cookieStore.set(ADMIN_SESSION_COOKIE, '', SESSION_COOKIE_CLEARED);
    }
    if (hasCustomerSession) {
      cookieStore.set(CUSTOMER_SESSION_COOKIE, '', SESSION_COOKIE_CLEARED);
    }

    // Also clear the old legacy session cookie if it exists (for migration safety)
    if (cookieStore.has(SESSION_COOKIE)) {
      cookieStore.set(SESSION_COOKIE, '', SESSION_COOKIE_CLEARED);
    }

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
