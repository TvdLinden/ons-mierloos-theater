import { db } from '@ons-mierloos-theater/shared/db';
import { orders, payments, lineItems, performances, coupons, couponUsages } from '@ons-mierloos-theater/shared/db/schema';
import { eq, and, lt, sql, isNull } from 'drizzle-orm';

export interface OrphanedOrderCleanupJobData {
  olderThanHours?: number; // Default: 24 hours
}

/**
 * Clean up orphaned orders that are stuck in 'pending' status
 * These are orders where payment was created but never completed/failed
 * After timeout period, release seats and coupons
 *
 * @param jobId Job ID
 * @param data Cleanup configuration
 * @returns Cleanup results
 */
export async function handleOrphanedOrderCleanup(
  jobId: string,
  data: OrphanedOrderCleanupJobData,
): Promise<{ ordersProcessed: number; seatsReleased: number; couponsReleased: number }> {
  const olderThanHours = data.olderThanHours || 24;

  console.log(`[ORPHANED_CLEANUP] Starting cleanup for orders older than ${olderThanHours}h`);

  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

  // Find orders that are:
  // 1. Status = 'pending'
  // 2. Created > X hours ago
  // 3. Either have no payment, or payment is pending/failed
  const orphanedOrders = await db.query.orders.findMany({
    where: and(eq(orders.status, 'pending'), lt(orders.createdAt, cutoffDate)),
    with: {
      payments: true,
      lineItems: true,
      couponUsages: true,
    },
  });

  if (orphanedOrders.length === 0) {
    console.log(`[ORPHANED_CLEANUP] No orphaned orders found`);
    return { ordersProcessed: 0, seatsReleased: 0, couponsReleased: 0 };
  }

  console.log(`[ORPHANED_CLEANUP] Found ${orphanedOrders.length} orphaned orders`);

  let totalSeatsReleased = 0;
  let totalCouponsReleased = 0;

  for (const order of orphanedOrders) {
    try {
      // Check if payment exists and is not in pending state
      const hasActivePayment = order.payments?.some(
        (p) => p.status === 'pending' || p.status === 'processing',
      );

      // Skip if payment is actively being processed
      if (hasActivePayment) {
        console.log(`[ORPHANED_CLEANUP] Skipping order ${order.id} - payment still active`);
        continue;
      }

      console.log(`[ORPHANED_CLEANUP] Processing order ${order.id}`);

      await db.transaction(async (tx) => {
        // Release seats
        if (order.lineItems && order.lineItems.length > 0) {
          const performanceGroups = new Map<string, number>();

          for (const item of order.lineItems) {
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
            totalSeatsReleased += quantity;
            console.log(`[ORPHANED_CLEANUP] Released ${quantity} seats for performance ${perfId}`);
          }
        }

        // Release coupons
        if (order.couponUsages && order.couponUsages.length > 0) {
          for (const usage of order.couponUsages) {
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

            totalCouponsReleased++;
            console.log(`[ORPHANED_CLEANUP] Released coupon ${usage.couponId}`);
          }
        }

        // Mark order as cancelled
        await tx
          .update(orders)
          .set({
            status: 'cancelled',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        // Mark any payments as cancelled
        if (order.payments && order.payments.length > 0) {
          for (const payment of order.payments) {
            await tx
              .update(payments)
              .set({
                status: 'cancelled',
                updatedAt: new Date(),
                completedAt: new Date(),
              })
              .where(eq(payments.id, payment.id));
          }
        }

        console.log(`✅ Cleaned up orphaned order ${order.id}`);
      });
    } catch (error) {
      console.error(`[ORPHANED_CLEANUP] Error processing order ${order.id}:`, error);
      // Continue with next order
    }
  }

  console.log(
    `✅ [ORPHANED_CLEANUP] Complete: ${orphanedOrders.length} orders, ${totalSeatsReleased} seats, ${totalCouponsReleased} coupons`,
  );

  return {
    ordersProcessed: orphanedOrders.length,
    seatsReleased: totalSeatsReleased,
    couponsReleased: totalCouponsReleased,
  };
}
