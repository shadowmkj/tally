import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // Redirect to /admin if already logged in as admin
  if (pathname === '/admin/login' && sessionCookie) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Protect /admin and /admin/* routes, except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
