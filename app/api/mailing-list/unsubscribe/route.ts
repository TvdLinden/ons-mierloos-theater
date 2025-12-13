import { NextRequest, NextResponse } from 'next/server';
import {
  unsubscribeFromMailingList,
  unsubscribeByToken,
  getSubscriberByToken,
} from '@/lib/commands/mailingList';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await unsubscribeFromMailingList(email.toLowerCase().trim());

    return NextResponse.json({ success: true, message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Error unsubscribing from mailing list:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new NextResponse('<h1>Invalid unsubscribe link</h1>', {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const subscriber = await getSubscriberByToken(token);
    if (!subscriber) {
      return new NextResponse('<h1>Unsubscribe link not found or already used</h1>', {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    await unsubscribeByToken(token);

    return new NextResponse(
      `<html><body><h1>${subscriber.email} is unsubscribed</h1><p>We're sorry to see you go.</p></body></html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      },
    );
  } catch (error) {
    console.error('Error handling unsubscribe token:', error);
    return new NextResponse('<h1>Unsubscribe failed</h1>', {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
