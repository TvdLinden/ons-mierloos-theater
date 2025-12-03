import { db } from '@/lib/db';
import { orders, lineItems, performances } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

/**
 * Get all orders with their line items and performances
 */
export async function getAllOrders() {
  return db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: {
      lineItems: {
        with: {
          performance: {
            with: {
              show: true,
            },
          },
        },
      },
      payments: true,
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get order by ID with all related data
 */
export async function getOrderById(orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      lineItems: {
        with: {
          performance: true,
        },
      },
      payments: true,
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get sales statistics
 */
export async function getSalesStats() {
  const stats = await db
    .select({
      totalOrders: sql<number>`count(*)`,
      totalRevenue: sql<string>`coalesce(sum(${orders.totalAmount}), 0)`,
      paidOrders: sql<number>`count(*) filter (where ${orders.status} = 'paid')`,
      pendingOrders: sql<number>`count(*) filter (where ${orders.status} = 'pending')`,
    })
    .from(orders);

  return stats[0];
}

/**
 * Get ticket sales by performance
 */
export async function getTicketSalesByPerformance() {
  return db
    .select({
      performanceId: performances.id,
      performanceTitle: performances.title,
      performanceDate: performances.date,
      totalTickets: sql<number>`coalesce(sum(${lineItems.quantity}), 0)`,
      totalRevenue: sql<string>`coalesce(sum(${lineItems.quantity} * ${lineItems.pricePerTicket}), 0)`,
    })
    .from(lineItems)
    .innerJoin(performances, eq(lineItems.performanceId, performances.id))
    .innerJoin(orders, eq(lineItems.orderId, orders.id))
    .where(eq(orders.status, 'paid'))
    .groupBy(performances.id, performances.title, performances.date)
    .orderBy(desc(performances.date));
}

/**
 * Get all orders for a specific user
 */
export async function getUserOrders(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
    with: {
      lineItems: {
        with: {
          performance: {
            with: {
              show: true,
            },
          },
        },
      },
      payments: true,
    },
  });
}
