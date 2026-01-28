import { db, Payment, Order } from '@/lib/db';
import { payments, orders, lineItems, couponUsages, coupons, performances } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { sendOrderConfirmationEmail } from '@/lib/utils/email';
import { createTicketsForLineItem } from '@/lib/commands/tickets';

// Mollie client setup
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;
const MOLLIE_API_URL = 'https://api.mollie.com/v2';
const USE_MOCK_PAYMENT = process.env.USE_MOCK_PAYMENT === 'true';

export type CreatePayment = {
  orderId: string;
  amount: string;
  currency?: string;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata?: Record<string, unknown>;
};

/**
 * Create a new payment record in the database
 */
export async function createPayment(
  data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>,
): Promise<Payment> {
  const [payment] = await db
    .insert(payments)
    .values({
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency || 'EUR',
      status: data.status || 'pending',
      paymentMethod: data.paymentMethod,
      paymentProvider: data.paymentProvider || 'mollie',
      providerTransactionId: data.providerTransactionId,
      providerPaymentUrl: data.providerPaymentUrl,
      metadata: data.metadata,
    })
    .returning();

  return payment;
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: Payment['status'],
  completedAt?: Date,
): Promise<Payment | null> {
  const [updated] = await db
    .update(payments)
    .set({
      status,
      completedAt: completedAt || null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning();

  return updated || null;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: Order['status'],
): Promise<Order | null> {
  const [updated] = await db
    .update(orders)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId))
    .returning();

  return updated || null;
}

/**
 * Create a Mollie payment (or mock payment in dev mode)
 */
export async function createMolliePayment(data: CreatePayment): Promise<{
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  error?: string;
}> {
  // Use mock payment for testing without Mollie credentials
  if (USE_MOCK_PAYMENT) {
    return createMockPayment(data);
  }

  if (!MOLLIE_API_KEY) {
    return { success: false, error: 'Mollie API key not configured' };
  }

  try {
    const response = await fetch(`${MOLLIE_API_URL}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: {
          currency: data.currency || 'EUR',
          value: data.amount,
        },
        description: data.description,
        redirectUrl: data.redirectUrl,
        webhookUrl: data.webhookUrl,
        metadata: data.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mollie API error:', error);
      return { success: false, error: 'Payment creation failed' };
    }

    const molliePayment = await response.json();

    // Save payment record in database
    await createPayment({
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency || 'EUR',
      status: 'pending',
      paymentMethod: null,
      paymentProvider: 'mollie',
      providerTransactionId: molliePayment.id,
      providerPaymentUrl: molliePayment._links.checkout.href,
      metadata: JSON.stringify(data.metadata || {}),
    });

    return {
      success: true,
      paymentUrl: molliePayment._links.checkout.href,
      paymentId: molliePayment.id,
    };
  } catch (error) {
    console.error('Error creating Mollie payment:', error);
    return { success: false, error: 'Payment creation failed' };
  }
}

/**
 * Create a mock payment for testing
 */
async function createMockPayment(data: CreatePayment): Promise<{
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  error?: string;
}> {
  const mockPaymentId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Save payment record in database
  await createPayment({
    orderId: data.orderId,
    amount: data.amount,
    currency: data.currency || 'EUR',
    status: 'pending',
    paymentMethod: 'mock',
    paymentProvider: 'mock',
    providerTransactionId: mockPaymentId,
    providerPaymentUrl: `${baseUrl}/checkout/mock-payment?id=${mockPaymentId}`,
    metadata: JSON.stringify(data.metadata || {}),
  });

  return {
    success: true,
    paymentUrl: `${baseUrl}/checkout/mock-payment?id=${mockPaymentId}&orderId=${data.orderId}&amount=${data.amount}`,
    paymentId: mockPaymentId,
  };
}

/**
 * Get Mollie payment status
 */
export async function getMolliePaymentStatus(molliePaymentId: string): Promise<{
  success: boolean;
  status?: string;
  method?: string;
  error?: string;
}> {
  if (!MOLLIE_API_KEY) {
    return { success: false, error: 'Mollie API key not configured' };
  }

  try {
    const response = await fetch(`${MOLLIE_API_URL}/payments/${molliePaymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${MOLLIE_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mollie API error:', error);
      return { success: false, error: 'Failed to fetch payment status' };
    }

    const molliePayment = await response.json();
    return {
      success: true,
      status: molliePayment.status,
      method: molliePayment.method,
    };
  } catch (error) {
    console.error('Error fetching Mollie payment:', error);
    return { success: false, error: 'Failed to fetch payment status' };
  }
}

/**
 * Handle Mollie webhook notification
 */
export async function handleMollieWebhook(molliePaymentId: string): Promise<void> {
  // Fetch the payment status from Mollie
  const { success, status, method, error } = await getMolliePaymentStatus(molliePaymentId);

  if (!success || !status) {
    console.error('Failed to get payment status:', error);
    return;
  }

  // Find payment in our database
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerTransactionId, molliePaymentId))
    .limit(1);

  if (!payment) {
    console.error('Payment not found:', molliePaymentId);
    return;
  }

  // Map Mollie status to our payment status
  let paymentStatus: Payment['status'];
  let orderStatus: Order['status'];

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
    default:
      console.log('Unknown Mollie status:', status);
      return;
  }

  // Handle payment failure - release reserved seats
  if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
    console.log(`[WEBHOOK] Payment ${paymentStatus}: ${payment.orderId}`);
    try {
      await handlePaymentFailure(payment.orderId);
    } catch (error) {
      console.error('Error handling payment failure:', error);
      // Still update payment status even if seat release fails
    }
  }

  // Update payment status and order status in a transaction
  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        status: paymentStatus,
        paymentMethod: method || payment.paymentMethod,
        completedAt: paymentStatus === 'succeeded' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    await tx
      .update(orders)
      .set({
        status: orderStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, payment.orderId));
  });

  // If payment succeeded, generate tickets and send email
  if (orderStatus === 'paid') {
    await handlePaymentSuccess(payment.orderId);
  }
}

/**
 * Handle successful payment - generate tickets and send confirmation email
 * Uses transaction to ensure ticket generation is atomic
 */
async function handlePaymentSuccess(orderId: string): Promise<void> {
  console.log(`[PAYMENT_SUCCESS] Processing success for order ${orderId}`);

  try {
    // Fetch order with line items and performances in a transaction
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

    // Generate tickets in a transaction to ensure atomicity
    // If any ticket generation fails, all fail together
    await db.transaction(async (tx) => {
      console.log(
        `[PAYMENT_SUCCESS] Generating ${orderLineItems.length} line items for order ${orderId}`,
      );

      for (const lineItem of orderLineItems) {
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
        );

        console.log(`✓ Generated ${createdTickets.length} tickets for line item ${lineItem.id}`);
      }
    });

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
 * Handle payment failure - release reserved seats back to performances
 * Called when payment webhook indicates failure or payment is cancelled
 * Uses transaction to ensure seat release is atomic
 */
export async function handlePaymentFailure(orderId: string): Promise<void> {
  console.log(`[PAYMENT_FAILED] Processing failure for order ${orderId}`);

  try {
    // Get order with line items BEFORE transaction
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      console.error(`[PAYMENT_FAILED] Order not found: ${orderId}`);
      return;
    }

    // Only process if order is still pending (not already processed)
    if (order.status !== 'pending') {
      console.log(
        `[PAYMENT_FAILED] Order ${orderId} is already ${order.status}, skipping seat release`,
      );
      return;
    }

    // Get line items to know which performances to release seats for
    const orderLineItems = await db.query.lineItems.findMany({
      where: eq(lineItems.orderId, orderId),
    });

    if (orderLineItems.length === 0) {
      console.error(`[PAYMENT_FAILED] No line items found for order ${orderId}`);
      return;
    }

    // Get coupon usages BEFORE transaction for later reference
    const orderCouponUsages = await db.query.couponUsages.findMany({
      where: eq(couponUsages.orderId, orderId),
    });

    // Group by performance to calculate total seats to release
    const performanceGroups = new Map<string, number>();
    for (const item of orderLineItems) {
      const current = performanceGroups.get(item.performanceId) || 0;
      performanceGroups.set(item.performanceId, current + item.quantity);
    }

    // Release seats and coupons in a transaction - atomic operation
    await db.transaction(async (tx) => {
      console.log(`[PAYMENT_FAILED] Releasing seats for ${performanceGroups.size} performances`);

      // Release seats for each performance
      for (const [perfId, quantity] of performanceGroups.entries()) {
        await tx.execute(
          sql`
            UPDATE ${performances}
            SET available_seats = available_seats + ${quantity}
            WHERE id = ${perfId}
          `,
        );
        console.log(`[PAYMENT_FAILED] Released ${quantity} seats for performance ${perfId}`);
      }

      // Mark order as failed in same transaction
      await tx
        .update(orders)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      // Release any applied coupons - delete coupon usage records and decrement usage count
      if (orderCouponUsages.length > 0) {
        // Delete coupon usage records
        await tx.delete(couponUsages).where(eq(couponUsages.orderId, orderId));

        // Decrement usage count for each coupon
        for (const couponUsage of orderCouponUsages) {
          await tx.execute(
            sql`
              UPDATE ${coupons}
              SET usage_count = GREATEST(0, usage_count - 1),
                  updated_at = NOW()
              WHERE id = ${couponUsage.couponId}
            `,
          );
          console.log(
            `[PAYMENT_FAILED] Released coupon usage for coupon ${couponUsage.couponId}, order ${orderId}`,
          );
        }
      }

      console.log(`[PAYMENT_FAILED] Order ${orderId} marked as failed with coupon release`);
    });

    console.log(`✅ Payment failure processed: ${orderId}, seats released`);
  } catch (error) {
    console.error(`[PAYMENT_FAILED] Error processing failure for ${orderId}:`, error);
    throw error;
  }
}
