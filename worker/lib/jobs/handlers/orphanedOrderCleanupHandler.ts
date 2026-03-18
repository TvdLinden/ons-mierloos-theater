import { db } from '@ons-mierloos-theater/shared/db';
import {
  orders,
  payments,
  lineItems,
  performances,
  coupons,
  couponUsages,
} from '@ons-mierloos-theater/shared/db/schema';
import { eq, and, lt, sql, inArray } from 'drizzle-orm';

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

  console.log(
    `[ORPHANED_CLEANUP] Starting cleanup for orders older than ${olderThanHours}h or with expired performances`,
  );

  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

  // Find pending order IDs where at least one line item's performance date is in the past
  const expiredPerfRows = await db
    .selectDistinct({ orderId: lineItems.orderId })
    .from(lineItems)
    .innerJoin(performances, eq(lineItems.performanceId, performances.id))
    .innerJoin(orders, and(eq(lineItems.orderId, orders.id), eq(orders.status, 'pending')))
    .where(lt(performances.date, now));
  const expiredPerfOrderIds = expiredPerfRows.map((r) => r.orderId).filter(Boolean) as string[];

  // Find pending orders that are either:
  // 1. Created > X hours ago (time-based orphan)
  // 2. Have a line item for a performance that has already passed
  const timeBasedOrders = await db.query.orders.findMany({
    where: and(eq(orders.status, 'pending'), lt(orders.createdAt, cutoffDate)),
    with: { payments: true, lineItems: true, couponUsages: true },
  });

  const expiredPerfOrders =
    expiredPerfOrderIds.length > 0
      ? await db.query.orders.findMany({
          where: and(eq(orders.status, 'pending'), inArray(orders.id, expiredPerfOrderIds)),
          with: { payments: true, lineItems: true, couponUsages: true },
        })
      : [];

  // Deduplicate by order ID
  const seen = new Set<string>();
  const orphanedOrders = [...timeBasedOrders, ...expiredPerfOrders].filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  });

  if (orphanedOrders.length === 0) {
    console.log(`[ORPHANED_CLEANUP] No orphaned orders found`);
    return { ordersProcessed: 0, seatsReleased: 0, couponsReleased: 0 };
  }

  console.log(`[ORPHANED_CLEANUP] Found ${orphanedOrders.length} orphaned orders`);

  let ordersProcessed = 0;
  let totalSeatsReleased = 0;
  let totalCouponsReleased = 0;

  for (const order of orphanedOrders) {
    try {
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
            // For past performances this has no practical effect on sales,
            // but keeps availableSeats consistent with reality.
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

        ordersProcessed++;
        console.log(`✅ Cleaned up orphaned order ${order.id}`);
      });
    } catch (error) {
      console.error(`[ORPHANED_CLEANUP] Error processing order ${order.id}:`, error);
      // Continue with next order
    }
  }

  console.log(
    `✅ [ORPHANED_CLEANUP] Complete: ${ordersProcessed}/${orphanedOrders.length} orders, ${totalSeatsReleased} seats, ${totalCouponsReleased} coupons`,
  );

  return {
    ordersProcessed,
    seatsReleased: totalSeatsReleased,
    couponsReleased: totalCouponsReleased,
  };
}
