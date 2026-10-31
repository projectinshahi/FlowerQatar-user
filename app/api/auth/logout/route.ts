import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_COOKIE_CLEARED } from '@/lib/session-cookie';

export async function POST() {
  try {
    const cookieStore = await cookies();
    // Set an expired cookie rather than delete(): a Set-Cookie only replaces a cookie with the
    // same name, domain and path, and delete() carries none of those attributes.
    cookieStore.set(SESSION_COOKIE, '', SESSION_COOKIE_CLEARED);

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
