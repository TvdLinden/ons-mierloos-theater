import { db, Payment, Order } from '@/lib/db';
import { payments, orders } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
 * Get Mollie payment status (or mock payment status from database)
 */
export async function getMolliePaymentStatus(molliePaymentId: string): Promise<{
  success: boolean;
  status?: string;
  method?: string;
  error?: string;
}> {
  // Handle mock payments - read status from database metadata
  if (USE_MOCK_PAYMENT || molliePaymentId.startsWith('mock_')) {
    return getMockPaymentStatus(molliePaymentId);
  }

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
 * Get mock payment status from database metadata
 */
async function getMockPaymentStatus(mockPaymentId: string): Promise<{
  success: boolean;
  status?: string;
  method?: string;
  error?: string;
}> {
  try {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.providerTransactionId, mockPaymentId))
      .limit(1);

    if (!payment) {
      return { success: false, error: 'Mock payment not found' };
    }

    // Verify this is actually a mock payment
    if (payment.paymentProvider !== 'mock') {
      return { success: false, error: 'Payment is not a mock payment' };
    }

    // Read the Mollie-like status from metadata (set by setMockPaymentStatus)
    const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    const mollieStatus = metadata.mockStatus || 'open';

    return {
      success: true,
      status: mollieStatus,
      method: payment.paymentMethod || 'mock',
    };
  } catch (error) {
    console.error('Error fetching mock payment:', error);
    return { success: false, error: 'Failed to fetch mock payment status' };
  }
}

/**
 * Set mock payment status in database metadata
 * Called by mock webhook before handleMollieWebhook
 */
export async function setMockPaymentStatus(
  mockPaymentId: string,
  mollieStatus: string,
): Promise<void> {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerTransactionId, mockPaymentId))
    .limit(1);

  if (!payment) {
    throw new Error(`Mock payment not found: ${mockPaymentId}`);
  }

  // Verify this is actually a mock payment - prevent manipulation of real payments
  if (payment.paymentProvider !== 'mock') {
    throw new Error(`Cannot set status on non-mock payment: ${mockPaymentId}`);
  }

  const metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
  metadata.mockStatus = mollieStatus;

  await db
    .update(payments)
    .set({
      metadata: JSON.stringify(metadata),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));
}

