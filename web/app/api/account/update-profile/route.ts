import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { db } from '@ons-mierloos-theater/shared/db';
import { users } from '@ons-mierloos-theater/shared/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { generateVerificationToken, sendVerificationEmail } from '@ons-mierloos-theater/shared/utils/email';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Naam en e-mailadres zijn verplicht' }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, session.user.id)))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik' }, { status: 400 });
    }

    // Get current user data to check if email changed
    const currentUser = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

    const emailChanged = currentUser[0].email !== email;

    // If email changed, generate new verification token and clear verified status
    const updateData: {
      name: string;
      email: string;
      emailVerified?: null;
      verificationToken?: string;
    } = {
      name,
      email,
    };

    if (emailChanged) {
      updateData.emailVerified = null;
      updateData.verificationToken = generateVerificationToken();
    }

    // Update user profile
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, session.user.id))
      .returning();

    // Send verification email if email changed
    if (emailChanged && updateData.verificationToken) {
      await sendVerificationEmail(email, name, updateData.verificationToken);
    }

    return NextResponse.json({
      success: true,
      emailChanged,
      user: {
        id: updatedUser[0].id,
        name: updatedUser[0].name,
        email: updatedUser[0].email,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van het profiel' },
      { status: 500 },
    );
  }
}
