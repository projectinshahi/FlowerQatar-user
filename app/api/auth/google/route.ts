import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { GOOGLE_STATE_COOKIE } from '@/lib/google-oauth';

export async function GET(req: Request) {
  const redirectUri = `${new URL(req.url).origin}/api/auth/google/callback`;
  const clientId = process.env.CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 });
  }

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  /*
   * `state` binds the callback to THIS browser. Without it, anyone could send a victim to the
   * callback carrying a code from another Google account and sign the victim into that account
   * (login CSRF). Lax is enough: Google returns via a top-level GET, which carries Lax cookies.
   */
  const state = randomBytes(24).toString('hex');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent&state=${state}`;

  const res = NextResponse.redirect(authUrl);
  res.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/google',
    maxAge: 10 * 60,
  });
  return res;
}
