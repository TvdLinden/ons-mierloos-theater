import { db, LineItem } from '@/lib/db';
import { lineItems } from '@/lib/db/schema';

export type CreateLineItem = {
  performanceId: string;
  userId?: string | null;
  orderId?: string | null;
  quantity: number;
  pricePerTicket?: string;
};

/**
 * Create a new line item record
 */
export async function createLineItem(item: CreateLineItem): Promise<LineItem> {
  const [newItem] = await db
    .insert(lineItems)
    .values({
      performanceId: item.performanceId,
      userId: item.userId || null,
      orderId: item.orderId || null,
      quantity: item.quantity,
      pricePerTicket: item.pricePerTicket || null,
    })
    .returning();

  return newItem;
}

/**
 * Create multiple line items in a single transaction
 */
export async function createLineItems(items: CreateLineItem[]): Promise<LineItem[]> {
  if (items.length === 0) {
    return [];
  }

  const newItems = await db
    .insert(lineItems)
    .values(
      items.map((item) => ({
        performanceId: item.performanceId,
        userId: item.userId || null,
        orderId: item.orderId || null,
        quantity: item.quantity,
        pricePerTicket: item.pricePerTicket || null,
      })),
    )
    .returning();

  return newItems;
}
