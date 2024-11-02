// middleware.js
import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request) {
  // Public paths that don't require authentication
  const publicPaths = ['/', '/api/auth/login'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get('auth-token');

  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const decoded = await verifyToken(token.value);
    
    // Add user info to request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('user-id', decoded.userId);
    requestHeaders.set('user-role', decoded.role);

    // Role-based route protection
    if (decoded.role !== 'admin' && request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/pos', request.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    // Invalid or expired token
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};