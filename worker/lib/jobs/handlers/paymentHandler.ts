import { db } from '@ons-mierloos-theater/shared/db';
import { orders, lineItems, performances } from '@ons-mierloos-theater/shared/db/schema';
import { eq, sql } from 'drizzle-orm';

export interface PaymentJobData {
  orderId: string;
  status: 'succeeded' | 'failed' | 'pending';
  paymentId: string;
}

/**
 * Handle payment job for seat release on failure
 * Called by the job worker when processing payment status updates
 */
export async function handlePaymentJob(
  jobId: string,
  data: PaymentJobData,
): Promise<{ success: boolean; orderId: string }> {
  const { orderId, status, paymentId } = data;

  console.log(`[PAYMENT_JOB] Processing payment ${paymentId} for order ${orderId}: ${status}`);

  try {
    if (status === 'failed') {
      // Get tickets/line items for this order to release seats
      const orderLineItems = await db.query.lineItems.findMany({
        where: eq(lineItems.orderId, orderId),
      });

      if (orderLineItems.length === 0) {
        console.log(`[PAYMENT_JOB] No line items found for order ${orderId}`);
        return { success: true, orderId };
      }

      // Release seats in transaction
      await db.transaction(async (tx) => {
        const performanceGroups = new Map<string, number>();
        for (const item of orderLineItems) {
          const current = performanceGroups.get(item.performanceId) || 0;
          performanceGroups.set(item.performanceId, current + item.quantity);
        }

        // Release all seats
        for (const [perfId, quantity] of performanceGroups.entries()) {
          await tx.execute(
            sql`
              UPDATE ${performances}
              SET available_seats = available_seats + ${quantity}
              WHERE id = ${perfId}
            `,
          );
          console.log(`[PAYMENT_JOB] Released ${quantity} seats for performance ${perfId}`);
        }

        // Mark order and line items as cancelled
        await tx.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, orderId));
      });

      console.log(`✅ Order ${orderId} cancelled and seats released due to payment failure`);
    } else if (status === 'succeeded') {
      // Mark order as paid
      await db.update(orders).set({ status: 'paid' }).where(eq(orders.id, orderId));
      console.log(`✅ Order ${orderId} marked as paid after successful payment`);
    }

    return { success: true, orderId };
  } catch (error) {
    console.error(`❌ Payment job failed for order ${orderId}:`, error);
    throw error;
  }
}
