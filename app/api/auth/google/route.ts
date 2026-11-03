import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { GOOGLE_STATE_COOKIE } from '@/lib/google-oauth';
import { COOKIE_SECURE } from '@/lib/session-cookie';
import { SITE_URL } from '@/lib/site';

export async function GET() {
  /*
   * Built from the configured site URL, not from the request.
   *
   * server.mjs hands Next a `port` but no `hostname`, so Next reconstructs request URLs
   * against its own default host: behind any reverse proxy this resolves to
   * localhost:<port>, never the public domain. Google rejects a redirect_uri that is not
   * the registered one, so sign-in failed with redirect_uri_mismatch wherever the app was
   * not reached directly on localhost. The callback builds the same value the same way -
   * Google requires the two to be identical.
   */
  const redirectUri = `${SITE_URL}/api/auth/google/callback`;
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
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/api/auth/google',
    maxAge: 10 * 60,
  });
  return res;
}
