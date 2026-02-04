import { db } from '../db';
import { orders, lineItems, performances, shows } from '../db/schema';
import { and, or, ilike, gte, lte, desc, asc, sql } from 'drizzle-orm';

export interface OrderFilter {
  search?: string;
  fromDate?: string; // ISO8601 string
  toDate?: string; // ISO8601 string
  status?: string; // order status filter
  sortBy?: 'createdAt' | 'customerName' | 'totalAmount';
  sortDir?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}

export async function getFilteredOrders({
  search = '',
  fromDate,
  toDate,
  status,
  sortBy = 'createdAt',
  sortDir = 'desc',
  offset = 0,
  limit = 20,
}: OrderFilter) {
  const whereClauses = [];

  if (search) {
    const like = `%${search}%`;
    whereClauses.push(
      or(
        ilike(sql`${orders.id}::text`, like),
        ilike(orders.customerName, like),
        ilike(orders.customerEmail, like),
      ),
    );
  }
  if (fromDate) {
    whereClauses.push(gte(orders.createdAt, new Date(fromDate)));
  }
  if (toDate) {
    whereClauses.push(lte(orders.createdAt, new Date(toDate)));
  }
  if (status) {
    whereClauses.push(sql`${orders.status} = ${status}`);
  }

  const where = whereClauses.length > 0 ? and(...whereClauses) : undefined;

  // Count total
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(where);

  // Fetch paginated, sorted orders
  const orderBy =
    sortBy === 'customerName'
      ? [sortDir === 'asc' ? asc(orders.customerName) : desc(orders.customerName)]
      : sortBy === 'totalAmount'
        ? [sortDir === 'asc' ? asc(orders.totalAmount) : desc(orders.totalAmount)]
        : [sortDir === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt)];

  const data = await db.query.orders.findMany({
    where,
    orderBy,
    limit,
    offset,
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

  return {
    data,
    total: count,
    offset,
    limit,
    totalPages: Math.ceil(count / limit),
  };
}
