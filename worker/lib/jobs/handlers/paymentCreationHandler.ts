import { db } from '@ons-mierloos-theater/shared/db';
import { payments, orders } from '@ons-mierloos-theater/shared/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

const USE_MOCK_PAYMENT = process.env.USE_MOCK_PAYMENT === 'true';

export interface PaymentCreationJobData {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
}

/**
 * Handle payment creation with Mollie (or mock payment in dev mode)
 * Called by worker when payment creation needs to be retried
 * @param jobId Job ID
 * @param data Payment creation data
 * @returns Payment URL and payment ID
 */
export async function handlePaymentCreation(
  jobId: string,
  data: PaymentCreationJobData,
): Promise<{ paymentUrl: string; paymentId: string }> {
  const {
    orderId,
    amount,
    currency,
    customerEmail,
    customerName,
    description,
    redirectUrl,
    webhookUrl,
  } = data;

  console.log(
    `[PAYMENT_CREATION] Creating payment for order ${orderId}, amount: ${amount} ${currency}`,
  );

  // Use mock payment for testing
  if (USE_MOCK_PAYMENT) {
    return handleMockPaymentCreation(data);
  }

  try {
    // Import Mollie client dynamically to avoid issues if not configured
    const { createMollieClient } = await import('@mollie/api-client');

    if (!process.env.MOLLIE_API_KEY) {
      throw new Error('MOLLIE_API_KEY not configured');
    }

    const mollieClient = createMollieClient({ apiKey: process.env.MOLLIE_API_KEY });

    // Create payment with Mollie
    const payment = await mollieClient.payments.create({
      amount: {
        currency: currency as 'EUR',
        value: amount.toFixed(2),
      },
      description: description || `Order ${orderId}`,
      redirectUrl,
      webhookUrl,
      metadata: {
        orderId,
        customerEmail,
        customerName,
      },
    });

    console.log(`[PAYMENT_CREATION] Mollie payment created: ${payment.id}`);

    // Store payment in database
    await db.insert(payments).values({
      orderId,
      amount: amount.toString(),
      currency,
      status: 'pending',
      paymentMethod: null,
      paymentProvider: 'mollie',
      providerTransactionId: payment.id,
      providerPaymentUrl: payment.getCheckoutUrl() || null,
      metadata: JSON.stringify({ customerEmail, customerName }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(`✅ Payment record created in database for order ${orderId}`);

    return {
      paymentUrl: payment.getCheckoutUrl() || '',
      paymentId: payment.id,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[PAYMENT_CREATION] Failed for order ${orderId}:`, errorMsg);

    // Mollie-specific error handling
    if (errorMsg.includes('Unable to reach Mollie')) {
      throw new Error('Mollie API is unreachable - will retry');
    }

    if (errorMsg.includes('timeout')) {
      throw new Error('Mollie API timeout - will retry');
    }

    throw new Error(`Payment creation failed: ${errorMsg}`);
  }
}

/**
 * Handle mock payment creation for testing
 * @param data Payment creation data
 * @returns Mock payment URL and ID
 */
async function handleMockPaymentCreation(
  data: PaymentCreationJobData,
): Promise<{ paymentUrl: string; paymentId: string }> {
  const { orderId, amount, currency, customerEmail, customerName } = data;

  const mockPaymentId = `mock_${randomUUID()}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  console.log(`[PAYMENT_CREATION] Creating MOCK payment: ${mockPaymentId}`);

  // Store mock payment in database
  await db.insert(payments).values({
    orderId,
    amount: amount.toString(),
    currency,
    status: 'pending',
    paymentMethod: 'mock',
    paymentProvider: 'mock',
    providerTransactionId: mockPaymentId,
    providerPaymentUrl: `${baseUrl}/checkout/mock-payment?id=${mockPaymentId}`,
    metadata: JSON.stringify({ customerEmail, customerName }),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`✅ Mock payment record created in database for order ${orderId}`);

  return {
    paymentUrl: `${baseUrl}/checkout/mock-payment?id=${mockPaymentId}&orderId=${orderId}&amount=${amount}`,
    paymentId: mockPaymentId,
  };
}
