import { NextRequest, NextResponse } from 'next/server';
import { createJob } from '@ons-mierloos-theater/shared/jobs/jobProcessor';

/**
 * Mollie webhook endpoint
 * Receives payment status updates from Mollie
 * Queues a job for async processing to respond quickly (<100ms)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const paymentId = new URLSearchParams(body).get('id');

    if (!paymentId) {
      console.error('[WEBHOOK] No payment ID in webhook');
      return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
    }

    console.log(`[WEBHOOK] Received webhook for payment ${paymentId}`);

    // Queue job for async processing (fast response to Mollie)
    // This prevents webhook timeouts and allows retries if processing fails
    await createJob('payment_webhook', { paymentId });

    console.log(`[WEBHOOK] Queued payment_webhook job for ${paymentId}`);

    // Return 200 OK immediately so Mollie doesn't retry
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[WEBHOOK] Error queueing webhook job:', error);

    // Still return 200 to prevent Mollie retries
    // The worker will pick up the job from the queue
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
