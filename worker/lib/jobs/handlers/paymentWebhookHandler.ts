import { db } from '@ons-mierloos-theater/shared/db';
import {
  payments,
  orders,
  lineItems,
  performances,
  coupons,
  couponUsages,
  tickets,
  orderRefunds,
} from '@ons-mierloos-theater/shared/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

const MOLLIE_API_URL = 'https://api.mollie.com/v2';
import { createTicketsForLineItem } from '@ons-mierloos-theater/shared/commands/tickets';
import { sendOrderConfirmationEmail } from '@ons-mierloos-theater/shared/utils/email';

const USE_MOCK_PAYMENT = process.env.USE_MOCK_PAYMENT === 'true';

export interface PaymentWebhookJobData {
  paymentId: string; // Mollie payment ID or mock payment ID
}

/**
 * Handle payment webhook processing
 * Called by worker to process payment status updates asynchronously
 * This decouples webhook response time from actual processing
 *
 * @param jobId Job ID
 * @param data Webhook data containing payment ID
 * @returns Processing result
 */
export async function handlePaymentWebhook(
  jobId: string,
  data: PaymentWebhookJobData,
): Promise<{ success: boolean; orderId: string; status: string }> {
  const { paymentId } = data;

  console.log(`[PAYMENT_WEBHOOK] Processing payment ${paymentId}`);

  // Get payment record from our database first
  const paymentRecord = await db.query.payments.findFirst({
    where: eq(payments.providerTransactionId, paymentId),
    with: {
      order: true,
    },
  });

  if (!paymentRecord) {
    throw new Error(`Payment record not found for payment ${paymentId}`);
  }

  const orderId = paymentRecord.orderId;

  // Check idempotency - don't reprocess if already in final state
  // Exception: allow re-processing when order is refund_pending (waiting for refund webhook)
  if (
    (paymentRecord.status === 'succeeded' || paymentRecord.status === 'failed') &&
    paymentRecord.order?.status !== 'refund_pending'
  ) {
    console.log(
      `[PAYMENT_WEBHOOK] Payment ${paymentId} already in final state: ${paymentRecord.status}`,
    );
    return { success: true, orderId, status: paymentRecord.status };
  }

  try {
    // Handle refund webhook when order is awaiting refund confirmation
    if (paymentRecord.order?.status === 'refund_pending') {
      return await handleRefundWebhook(orderId, paymentId, paymentRecord.paymentProvider ?? '');
    }

    let paymentStatus: string;

    // Handle mock payments differently
    if (USE_MOCK_PAYMENT || paymentRecord.paymentProvider === 'mock') {
      console.log(`[PAYMENT_WEBHOOK] Processing MOCK payment ${paymentId}`);
      // For mock payments, always treat as successful
      paymentStatus = 'paid';
    } else {
      // Fetch payment from Mollie
      const { createMollieClient } = await import('@mollie/api-client');

      if (!process.env.MOLLIE_API_KEY) {
        throw new Error('MOLLIE_API_KEY not configured');
      }

      const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });
      const molliePayment = await mollieClient.payments.get(paymentId);

      console.log(`[PAYMENT_WEBHOOK] Mollie payment status: ${molliePayment.status}`);
      paymentStatus = molliePayment.status;
    }

    // Handle different payment statuses
    switch (paymentStatus) {
      case 'paid':
        await handlePaymentSuccess(orderId, paymentId);
        return { success: true, orderId, status: 'succeeded' };

      case 'failed':
      case 'canceled':
      case 'expired':
        await handlePaymentFailure(orderId, paymentId, paymentStatus);
        return { success: true, orderId, status: 'failed' };

      case 'pending':
      case 'open':
        // Payment still in progress, nothing to do yet
        console.log(`[PAYMENT_WEBHOOK] Payment ${paymentId} still pending/open`);
        return { success: true, orderId, status: 'pending' };

      default:
        console.warn(`[PAYMENT_WEBHOOK] Unknown payment status: ${paymentStatus}`);
        return { success: true, orderId, status: 'unknown' };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[PAYMENT_WEBHOOK] Error processing payment ${paymentId}:`, errorMsg);
    throw error;
  }
}

/**
 * Handle successful payment
 * Updates payment/order status, generates tickets, and sends confirmation email
 */
async function handlePaymentSuccess(orderId: string, paymentId: string): Promise<void> {
  console.log(`[PAYMENT_SUCCESS] Processing order ${orderId}`);

  try {
    // Fetch order with line items and performances
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    const orderLineItems = await db.query.lineItems.findMany({
      where: eq(lineItems.orderId, orderId),
      with: {
        performance: {
          with: {
            show: true,
          },
        },
      },
    });

    const orderCouponUsages = await db.query.couponUsages.findMany({
      where: eq(couponUsages.orderId, orderId),
      with: {
        coupon: true,
      },
    });

    if (!order || orderLineItems.length === 0) {
      console.error(`[PAYMENT_SUCCESS] Order or line items not found for ${orderId}`);
      return;
    }

    // Update payment and order status in transaction
    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          status: 'succeeded',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.providerTransactionId, paymentId));

      await tx
        .update(orders)
        .set({
          status: 'paid',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      console.log(`✅ Order ${orderId} marked as paid`);
    });

    // Check if tickets already exist (idempotency)
    const existingTickets = await db.query.tickets.findFirst({
      where: eq(tickets.orderId, orderId),
    });

    if (existingTickets) {
      console.log(
        `[PAYMENT_SUCCESS] Tickets already exist for order ${orderId}, skipping generation`,
      );
    } else {
      // Generate tickets in a transaction to ensure atomicity
      // If any ticket generation fails, all fail together
      await db.transaction(async (tx) => {
        console.log(
          `[PAYMENT_SUCCESS] Generating ${orderLineItems.length} line items for order ${orderId}`,
        );

        // Sort: non-wheelchair first to keep wheelchair zones open
        const sortedLineItems = [...orderLineItems].sort(
          (a, b) => (a.wheelchairAccess ? 1 : 0) - (b.wheelchairAccess ? 1 : 0),
        );

        for (const lineItem of sortedLineItems) {
          if (!lineItem.performance || !lineItem.quantity) {
            console.warn(
              `[PAYMENT_SUCCESS] Skipping line item ${lineItem.id}: missing performance or quantity`,
            );
            continue;
          }

          const createdTickets = await createTicketsForLineItem(
            lineItem.id,
            lineItem.performanceId,
            orderId,
            lineItem.quantity,
            lineItem.performance,
            lineItem.wheelchairAccess,
          );

          console.log(`✓ Generated ${createdTickets.length} tickets for line item ${lineItem.id}`);
        }
      });
    }

    // Send confirmation email (non-critical - don't let email failure block ticket generation)
    try {
      await sendOrderConfirmationEmail(order, orderLineItems, orderCouponUsages);
      console.log(`✅ Confirmation email sent for order ${orderId}`);
    } catch (emailError) {
      console.error(
        `[PAYMENT_SUCCESS] Failed to send confirmation email for order ${orderId}:`,
        emailError,
      );
      // Don't fail the entire flow if email fails
      // Tickets were already generated and persisted in the transaction above
    }

    console.log(`✅ Payment success processing completed for order ${orderId}`);
  } catch (error) {
    console.error(`[PAYMENT_SUCCESS] Error processing success for ${orderId}:`, error);
    throw error;
  }
}

/**
 * Handle failed payment
 * Releases seats, releases coupons, marks order as failed
 */
async function handlePaymentFailure(
  orderId: string,
  paymentId: string,
  reason: string,
): Promise<void> {
  console.log(`[PAYMENT_FAILURE] Processing order ${orderId}, reason: ${reason}`);

  await db.transaction(async (tx) => {
    // Get order details
    const order = await tx.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Check idempotency - don't reprocess if already failed/cancelled
    if (order.status === 'failed' || order.status === 'cancelled') {
      console.log(`[PAYMENT_FAILURE] Order ${orderId} already in final state: ${order.status}`);
      return;
    }

    // Get line items to release seats
    const orderLineItems = await tx.query.lineItems.findMany({
      where: eq(lineItems.orderId, orderId),
    });

    // Release seats
    const performanceGroups = new Map<string, number>();
    for (const item of orderLineItems) {
      if (!item.performanceId) continue;
      const current = performanceGroups.get(item.performanceId) || 0;
      performanceGroups.set(item.performanceId, current + (item.quantity || 0));
    }

    for (const [perfId, quantity] of performanceGroups.entries()) {
      await tx.execute(
        sql`
          UPDATE ${performances}
          SET available_seats = available_seats + ${quantity}
          WHERE id = ${perfId}
        `,
      );
      console.log(`[PAYMENT_FAILURE] Released ${quantity} seats for performance ${perfId}`);
    }

    // Release coupons (delete usage records and decrement usage count)
    const couponUsageRecords = await tx.query.couponUsages.findMany({
      where: eq(couponUsages.orderId, orderId),
    });

    for (const usage of couponUsageRecords) {
      // Decrement coupon usage count
      await tx.execute(
        sql`
          UPDATE ${coupons}
          SET usage_count = usage_count - 1
          WHERE id = ${usage.couponId}
        `,
      );

      // Delete usage record
      await tx.delete(couponUsages).where(eq(couponUsages.id, usage.id));

      console.log(`[PAYMENT_FAILURE] Released coupon ${usage.couponId}`);
    }

    // Update payment status
    await tx
      .update(payments)
      .set({
        status: 'failed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.providerTransactionId, paymentId));

    // Update order status
    await tx
      .update(orders)
      .set({
        status: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    console.log(`✅ Order ${orderId} marked as failed, seats and coupons released`);
  });
}

/**
 * Handle refund webhook — called when order is in refund_pending state.
 * Fetches refund status from Mollie and delegates to complete/fail handler.
 */
async function handleRefundWebhook(
  orderId: string,
  paymentId: string,
  paymentProvider: string,
): Promise<{ success: boolean; orderId: string; status: string }> {
  console.log(`[REFUND_WEBHOOK] Processing refund for order ${orderId}`);

  // Find our pending refund record
  const pendingRefund = await db.query.orderRefunds.findFirst({
    where: and(eq(orderRefunds.orderId, orderId), eq(orderRefunds.status, 'pending')),
  });

  if (!pendingRefund) {
    console.warn(`[REFUND_WEBHOOK] No pending refund found for order ${orderId}`);
    return { success: true, orderId, status: 'no_pending_refund' };
  }

  // Mock: auto-complete the refund
  if (USE_MOCK_PAYMENT || paymentProvider === 'mock') {
    console.log(`[REFUND_WEBHOOK] Auto-completing mock refund for order ${orderId}`);
    await handleRefundComplete(orderId, pendingRefund);
    return { success: true, orderId, status: 'refunded' };
  }

  if (!process.env.MOLLIE_API_KEY) {
    throw new Error('MOLLIE_API_KEY not configured');
  }

  // Fetch refunds for this payment from Mollie
  const response = await fetch(`${MOLLIE_API_URL}/payments/${paymentId}/refunds`, {
    headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Mollie refunds: ${await response.text()}`);
  }

  const { _embedded } = await response.json();
  const mollieRefunds: Array<{ id: string; status: string }> = _embedded?.refunds ?? [];

  const mollieRefund = mollieRefunds.find((r) => r.id === pendingRefund.mollieRefundId);

  if (!mollieRefund) {
    console.warn(`[REFUND_WEBHOOK] Mollie refund ${pendingRefund.mollieRefundId} not found yet`);
    return { success: true, orderId, status: 'refund_pending' };
  }

  console.log(`[REFUND_WEBHOOK] Mollie refund status: ${mollieRefund.status}`);

  if (mollieRefund.status === 'refunded') {
    await handleRefundComplete(orderId, pendingRefund);
    return { success: true, orderId, status: 'refunded' };
  }

  if (mollieRefund.status === 'failed') {
    await handleRefundFailed(orderId, pendingRefund.id);
    return { success: true, orderId, status: 'refund_failed' };
  }

  // queued / pending / processing — still waiting
  return { success: true, orderId, status: 'refund_pending' };
}

/**
 * Complete a refund: mark order refunded, delete selected tickets, release seats.
 */
async function handleRefundComplete(
  orderId: string,
  refund: { id: string; ticketIdsToCancel: string | null },
): Promise<void> {
  console.log(`[REFUND_COMPLETE] Completing refund for order ${orderId}`);

  const ticketIds: string[] = JSON.parse(refund.ticketIdsToCancel ?? '[]');

  await db.transaction(async (tx) => {
    // Mark refund record as completed
    await tx
      .update(orderRefunds)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(orderRefunds.id, refund.id));

    // Mark order as refunded
    await tx
      .update(orders)
      .set({ status: 'refunded', updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    if (ticketIds.length > 0) {
      // Fetch tickets to determine which performances need seat release
      const ticketsToDelete = await tx.query.tickets.findMany({
        where: inArray(tickets.id, ticketIds),
      });

      // Release seats grouped by performance
      const seatsByPerf = new Map<string, number>();
      for (const t of ticketsToDelete) {
        seatsByPerf.set(t.performanceId, (seatsByPerf.get(t.performanceId) ?? 0) + 1);
      }

      for (const [perfId, qty] of seatsByPerf.entries()) {
        await tx.execute(
          sql`UPDATE ${performances} SET available_seats = available_seats + ${qty} WHERE id = ${perfId}`,
        );
        console.log(`[REFUND_COMPLETE] Released ${qty} seats for performance ${perfId}`);
      }

      // Delete the ticket rows (invalidates QR codes)
      await tx.delete(tickets).where(inArray(tickets.id, ticketIds));
      console.log(`[REFUND_COMPLETE] Deleted ${ticketIds.length} ticket(s)`);
    }
  });

  console.log(`✅ Refund completed for order ${orderId}`);
}

/**
 * Handle a failed refund: revert order status back to paid.
 */
async function handleRefundFailed(orderId: string, refundId: string): Promise<void> {
  console.log(`[REFUND_FAILED] Refund failed for order ${orderId}`);

  await db.transaction(async (tx) => {
    await tx.update(orderRefunds).set({ status: 'failed' }).where(eq(orderRefunds.id, refundId));

    await tx
      .update(orders)
      .set({ status: 'paid', updatedAt: new Date() })
      .where(eq(orders.id, orderId));
  });

  console.log(`[REFUND_FAILED] Order ${orderId} reverted to paid`);
}
