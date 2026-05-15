import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/.well-known')) {
    return NextResponse.next();
  }

  // Public routes
  const publicRoutes = ['/login', '/signup'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Health check
  if (pathname === '/health') {
    return NextResponse.next();
  }

  // If no token and trying to access protected route, redirect to login
  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|\.well-known).*)'],
};
