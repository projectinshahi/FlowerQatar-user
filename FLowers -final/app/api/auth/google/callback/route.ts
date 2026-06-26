import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const redirectUri = `${url.origin}/api/auth/google/callback`;
    
    if (!code) {
      return NextResponse.redirect(`${url.origin}/account/login?error=GoogleAuthFailed`);
    }

    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return NextResponse.redirect(`${url.origin}/account/login?error=GoogleTokenFailed`);
    }

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${url.origin}/account/login?error=GoogleEmailMissing`);
    }

    const normalizedEmail = googleUser.email.toLowerCase().trim();

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Link account if needed
      if (!user.providerId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider: 'GOOGLE',
            providerId: googleUser.id,
            isEmailVerified: true, // Google verifies emails
            profileImage: user.profileImage || googleUser.picture,
          },
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          firstName: googleUser.given_name || 'User',
          lastName: googleUser.family_name || '',
          email: normalizedEmail,
          provider: 'GOOGLE',
          providerId: googleUser.id,
          isEmailVerified: true, // Auto-verified by Google
          profileImage: googleUser.picture,
        },
      });
    }

    if (!user.isActive || user.isBlocked || user.isDeleted) {
      return NextResponse.redirect(`${url.origin}/account/login?error=AccountDeactivated`);
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

    return NextResponse.redirect(`${url.origin}/`);

  } catch (error) {
    console.error('Google Callback Error:', error);
    const url = new URL(req.url);
    return NextResponse.redirect(`${url.origin}/account/login?error=InternalError`);
  }
}
