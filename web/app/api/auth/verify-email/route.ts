import { NextRequest, NextResponse } from 'next/server';
import { db } from '@ons-mierloos-theater/shared/db';
import { users } from '@ons-mierloos-theater/shared/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/verify-error?reason=missing-token', request.url));
    }

    // Find user with this verification token
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.verificationToken, token), isNotNull(users.verificationToken)))
      .limit(1);

    if (!user) {
      return NextResponse.redirect(new URL('/auth/verify-error?reason=invalid-token', request.url));
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.redirect(new URL('/auth/signin?verified=already', request.url));
    }

    // Mark email as verified and clear token
    await db
      .update(users)
      .set({
        emailVerified: new Date(),
        verificationToken: null,
      })
      .where(eq(users.id, user.id));

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth/verify-success', request.url));
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.redirect(new URL('/auth/verify-error?reason=server-error', request.url));
  }
}
