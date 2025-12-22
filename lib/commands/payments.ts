import { db, Payment, Order } from '@/lib/db';
import { payments, orders, lineItems, couponUsages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

  // Update payment status and method if available
  await db
    .update(payments)
    .set({
      status: paymentStatus,
      paymentMethod: method || payment.paymentMethod,
      completedAt: paymentStatus === 'succeeded' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  // Update order status
  await updateOrderStatus(payment.orderId, orderStatus);

  // If payment succeeded, send confirmation email and link line items
  if (orderStatus === 'paid') {
    await db
      .update(lineItems)
      .set({ orderId: payment.orderId })
      .where(eq(lineItems.orderId, payment.orderId));

    // Fetch order with line items and performances for email
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, payment.orderId),
      });

      const orderLineItems = await db.query.lineItems.findMany({
        where: eq(lineItems.orderId, payment.orderId),
        with: {
          performance: {
            with: {
              show: true,
            },
          },
        },
      });

      const orderCouponUsages = await db.query.couponUsages.findMany({
        where: eq(couponUsages.orderId, payment.orderId),
        with: {
          coupon: true,
        },
      });

      if (order && orderLineItems.length > 0) {
        // Generate tickets for each line item
        console.log('Generating tickets for order:', payment.orderId);
        for (const lineItem of orderLineItems) {
          if (lineItem.performance && lineItem.quantity) {
            const createdTickets = await createTicketsForLineItem(
              lineItem.id,
              lineItem.performanceId!,
              payment.orderId,
              lineItem.quantity,
              lineItem.performance,
            );
            console.log(
              `✓ Generated ${createdTickets.length} tickets for line item ${lineItem.id}`,
            );
          }
        }

        await sendOrderConfirmationEmail(order, orderLineItems, orderCouponUsages);
        console.log('Confirmation email sent for order:', payment.orderId);
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the webhook if email fails
    }

    console.log('Payment succeeded for order:', payment.orderId);
  }
}
