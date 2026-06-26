import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('session')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // In Edge middleware, we rely on the API routes and Server Components to do the deep JWT/DB validation 
    // to confirm the user is actually an ADMIN. This just ensures they are logged in before accessing the dashboard.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
