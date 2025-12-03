import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Redirect unauthenticated users to signin
  if (!token || !token.email) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  const userRole = token.role as string;
  if (userRole !== 'admin' && userRole !== 'contributor') {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
