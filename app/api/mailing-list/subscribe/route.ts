import { NextRequest, NextResponse } from 'next/server';
import { subscribeToMailingList } from '@/lib/commands/mailingList';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const subscriber = await subscribeToMailingList(email.toLowerCase().trim(), name?.trim());

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to mailing list',
      subscriber: {
        email: subscriber.email,
        subscribedAt: subscriber.subscribedAt,
      },
    });
  } catch (error) {
    console.error('Error subscribing to mailing list:', error);
    return NextResponse.json({ error: 'Failed to subscribe to mailing list' }, { status: 500 });
  }
}
