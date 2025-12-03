import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Alle velden zijn verplicht' }, { status: 400 });
    }

    // Get user from database
    const user = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

    if (user.length === 0 || !user[0].passwordHash) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user[0].passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Het huidige wachtwoord is onjuist' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      message: 'Wachtwoord succesvol gewijzigd',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het wijzigen van het wachtwoord' },
      { status: 500 },
    );
  }
}
