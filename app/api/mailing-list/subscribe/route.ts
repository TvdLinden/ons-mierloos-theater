import { NextRequest, NextResponse } from 'next/server';
import { subscribeToMailingList } from '@/lib/commands/mailingList';
import { validateEmail } from '@/lib/utils/emailValidation';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate and normalize email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }

    const subscriber = await subscribeToMailingList(emailValidation.normalized, name?.trim());

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
