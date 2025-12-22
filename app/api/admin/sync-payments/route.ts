import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, orders } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getMolliePaymentStatus } from '@/lib/commands/payments';
import { updatePaymentStatus, updateOrderStatus } from '@/lib/commands/payments';
import { validateClientToken, hasScope } from '@/lib/auth/client-credentials';

const SYNC_SECRET = process.env.PAYMENT_SYNC_SECRET;
const MOCK_PAYMENT_AUTO_COMPLETE = process.env.MOCK_PAYMENT_AUTO_COMPLETE === 'true';
const APP_ID = process.env.APP_ID || 'self'; // This app's ID for scope validation

interface SyncResult {
  total: number;
  mollie: {
    checked: number;
    updated: number;
  };
  mock: {
    checked: number;
    updated: number;
  };
  errors: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Try JWT token first (preferred for automation)
    const token = validateClientToken(request);
    if (token) {
      // Validate required scope for this endpoint
      if (!hasScope(token, APP_ID, 'sync:payments')) {
        return NextResponse.json(
          { error: 'Forbidden', error_description: 'Missing required scope: sync:payments' },
          { status: 403 },
        );
      }
    } else {
      // Fall back to legacy secret-based authentication
      const authHeader = request.headers.get('authorization');
      const secret = new URL(request.url).searchParams.get('secret');

      if (!SYNC_SECRET || (authHeader !== `Bearer ${SYNC_SECRET}` && secret !== SYNC_SECRET)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const result: SyncResult = {
      total: 0,
      mollie: { checked: 0, updated: 0 },
      mock: { checked: 0, updated: 0 },
      errors: [],
    };

    // Fetch all pending/processing payments
    const pendingPayments = await db
      .select()
      .from(payments)
      .where(inArray(payments.status, ['pending', 'processing']));

    result.total = pendingPayments.length;

    for (const payment of pendingPayments) {
      try {
        if (payment.paymentProvider === 'mollie') {
          result.mollie.checked++;
          await syncMolliePayment(payment, result);
        } else if (payment.paymentProvider === 'mock') {
          result.mock.checked++;
          await syncMockPayment(payment, result);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Payment ${payment.id}: ${errorMsg}`);
        console.error(`Error syncing payment ${payment.id}:`, error);
      }
    }

    console.log('Payment sync completed:', result);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Payment sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

async function syncMolliePayment(
  payment: typeof payments.$inferSelect,
  result: SyncResult,
): Promise<void> {
  if (!payment.providerTransactionId) {
    result.errors.push(`Payment ${payment.id}: No Mollie transaction ID`);
    return;
  }

  const { success, status, method } = await getMolliePaymentStatus(payment.providerTransactionId);

  if (!success || !status) {
    result.errors.push(`Payment ${payment.id}: Failed to fetch Mollie status`);
    return;
  }

  // Map Mollie status to our payment status
  let paymentStatus: typeof payments.$inferSelect.status | null = null;
  let orderStatus: typeof orders.$inferSelect.status | null = null;

  switch (status) {
    case 'paid':
      paymentStatus = 'succeeded';
      orderStatus = 'paid';
      break;
    case 'failed':
    case 'expired':
      paymentStatus = 'failed';
      orderStatus = 'failed';
      break;
    case 'canceled':
      paymentStatus = 'cancelled';
      orderStatus = 'cancelled';
      break;
    case 'pending':
    case 'open':
      paymentStatus = 'processing';
      orderStatus = 'pending';
      break;
  }

  // Only update if status changed
  if (paymentStatus && paymentStatus !== payment.status) {
    result.mollie.updated++;

    // Update payment
    await updatePaymentStatus(
      payment.id,
      paymentStatus,
      paymentStatus === 'succeeded' ? new Date() : undefined,
    );

    // Update payment method if available
    if (method) {
      await db.update(payments).set({ paymentMethod: method }).where(eq(payments.id, payment.id));
    }

    // Update order status
    if (orderStatus) {
      await updateOrderStatus(payment.orderId, orderStatus);
      console.log(`Updated payment ${payment.id} and order ${payment.orderId} to ${orderStatus}`);
    }
  }
}

async function syncMockPayment(
  payment: typeof payments.$inferSelect,
  result: SyncResult,
): Promise<void> {
  // If mock auto-complete is enabled, mark pending mock payments as succeeded
  if (MOCK_PAYMENT_AUTO_COMPLETE && payment.status === 'pending') {
    result.mock.updated++;

    // Update payment to succeeded
    await updatePaymentStatus(payment.id, 'succeeded', new Date());

    // Update order to paid
    await updateOrderStatus(payment.orderId, 'paid');
    console.log(`Auto-completed mock payment ${payment.id} and order ${payment.orderId}`);
  }
}
