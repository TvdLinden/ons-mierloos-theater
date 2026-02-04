import { db, Order } from '../db';
import { orders } from '../db/schema';
import { eq } from 'drizzle-orm';

export type CreateOrder = {
  userId?: string | null;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  status?: Order['status'];
};

/**
 * Create a new order
 */
export async function createOrder(data: CreateOrder): Promise<Order> {
  const [order] = await db
    .insert(orders)
    .values({
      userId: data.userId || null,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      totalAmount: data.totalAmount,
      status: data.status || 'pending',
    })
    .returning();

  return order;
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<Order | null> {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

  return order || null;
}
