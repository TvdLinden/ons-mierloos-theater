import { NextRequest, NextResponse } from 'next/server';
import { handleMollieWebhook } from '@/lib/commands/payments';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id: mockPaymentId } = body;

    if (!mockPaymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    console.log(`[MOCK_WEBHOOK] Processing payment: ${mockPaymentId}`);

    // Use the same webhook handler as Mollie
    // This ensures mock and real payments use identical logic:
    // - Same transaction boundaries
    // - Same seat release on failure
    // - Same ticket generation on success
    // - Same coupon logic handling
    await handleMollieWebhook(mockPaymentId);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[MOCK_WEBHOOK] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
