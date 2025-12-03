import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/utils/email';
import { requireRole } from '@/lib/utils/auth';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await sendTestEmail(email);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Test email sent successfully' });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json({ error: 'Failed to send test email' }, { status: 500 });
  }
}
