import { NextResponse } from 'next/server';

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

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
