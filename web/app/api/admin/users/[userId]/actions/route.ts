import { NextRequest, NextResponse } from 'next/server';
import { db } from '@ons-mierloos-theater/shared/db';
import { users } from '@ons-mierloos-theater/shared/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { generateVerificationToken, sendVerificationEmail } from '@ons-mierloos-theater/shared/utils/email';

// Verify the request is from an admin
async function requireAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return null;
  }
  return session;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // Check admin auth
    const session = await requireAdminAuth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const { action } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // Get the user
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'resend-verification': {
        // Generate new verification token
        const verificationToken = generateVerificationToken();

        // Update user with new token
        await db
          .update(users)
          .set({
            verificationToken,
          })
          .where(eq(users.id, userId));

        // Send verification email
        const emailResult = await sendVerificationEmail(
          user.email,
          user.name || 'User',
          verificationToken,
        );

        if (!emailResult.success) {
          return NextResponse.json(
            { error: 'Failed to send verification email: ' + emailResult.error },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: `Verification email sent to ${user.email}`,
        });
      }

      case 'mark-verified': {
        // Manually mark user as verified (admin action)
        await db
          .update(users)
          .set({
            emailVerified: new Date(),
            verificationToken: null,
          })
          .where(eq(users.id, userId));

        return NextResponse.json({
          success: true,
          message: `User ${user.email} marked as verified`,
        });
      }

      case 'clear-tokens': {
        // Clear any reset tokens (useful if user lost access)
        await db
          .update(users)
          .set({
            verificationToken: null,
            resetToken: null,
            resetTokenExpiry: null,
          })
          .where(eq(users.id, userId));

        return NextResponse.json({
          success: true,
          message: `Tokens cleared for ${user.email}`,
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in user action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
