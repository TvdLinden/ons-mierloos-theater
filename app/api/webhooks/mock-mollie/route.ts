import { NextRequest, NextResponse } from 'next/server';
import { setMockPaymentStatus } from '@/lib/commands/payments';
import { createJob } from '@/lib/jobs/jobProcessor';

// Valid Mollie-like statuses that can be simulated
const VALID_STATUSES = ['paid', 'failed', 'canceled', 'expired', 'pending', 'open'] as const;
type MockStatus = (typeof VALID_STATUSES)[number];

/**
 * Mock Mollie webhook endpoint
 * Simulates Mollie webhook for testing
 * Queues a job for async processing (same as real Mollie webhook)
 * This ensures mock and real payments use identical logic and handlers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id: mockPaymentId } = body;

    // Get status from query param, default to 'paid'
    const status = (request.nextUrl.searchParams.get('status') || 'paid') as MockStatus;

    if (!mockPaymentId) {
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    console.log(`[MOCK_WEBHOOK] Processing payment: ${mockPaymentId} with status: ${status}`);

    // Set the mock payment status in the database
    // The worker's handlePaymentWebhook reads this to determine payment status
    await setMockPaymentStatus(mockPaymentId, status);

    // Queue job for async processing (same as real Mollie webhook)
    // This ensures both use the same worker handler: handlePaymentWebhook
    await createJob('payment_webhook', { paymentId: mockPaymentId });

    console.log(`[MOCK_WEBHOOK] Queued payment_webhook job for ${mockPaymentId}`);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[MOCK_WEBHOOK] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
