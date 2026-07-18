import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge guard for the admin dashboard (Next.js 16 "proxy" convention — the renamed
 * successor to `middleware`). It only checks that a `session` cookie is present before
 * allowing access to /admin; the actual JWT verification and ADMIN role check happen in
 * the API routes and Server Components (which have DB access). Logic unchanged from the
 * previous middleware.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
