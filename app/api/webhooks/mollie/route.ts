import { NextRequest, NextResponse } from 'next/server';
import { handleMollieWebhook } from '@/lib/commands/payments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const paymentId = new URLSearchParams(body).get('id');

    if (!paymentId) {
      console.error('No payment ID in webhook');
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    // Process the webhook
    await handleMollieWebhook(paymentId);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Mollie webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
