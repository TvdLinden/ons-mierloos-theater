import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  // Properly validate JWT token instead of just checking cookie existence
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if user is authenticated
  if (!token || !token.email) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Check if user has required role for admin access
  const userRole = token.role as string;
  if (userRole !== 'admin' && userRole !== 'contributor') {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
