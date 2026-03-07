import { pgTable, pgEnum, varchar, text, decimal, timestamp, index, uuid, integer, serial, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';
import { performances } from './shows';

const orderStatusValues = ['pending', 'paid', 'failed', 'cancelled', 'refunded'] as const;
type OrderStatus = (typeof orderStatusValues)[number];

export const orderStatus = pgEnum(
  'order_status',
  orderStatusValues as unknown as [OrderStatus, ...OrderStatus[]],
);

// Orders table - groups ticket sales into a single transaction
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    customerName: varchar('customer_name', { length: 100 }).notNull(),
    customerEmail: varchar('customer_email', { length: 255 }).notNull(),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    invoiceNumber: serial('invoice_number'),
    status: orderStatus('status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('orders_user_id_idx').on(table.userId),
    index('orders_status_idx').on(table.status),
    index('orders_customer_email_idx').on(table.customerEmail),
    index('orders_created_at_idx').on(table.createdAt),
  ],
);

export const lineItems = pgTable(
  'line_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    performanceId: uuid('performance_id').references(() => performances.id),
    userId: uuid('user_id').references(() => users.id),
    quantity: integer('quantity'),
    pricePerTicket: decimal('price_per_ticket', { precision: 8, scale: 2 }),
    purchaseDate: timestamp('purchase_date', { withTimezone: true }).defaultNow(),
    wheelchairAccess: boolean('wheelchair_access').notNull().default(false),
  },
  (table) => [
    index('line_items_order_id_idx').on(table.orderId),
    index('line_items_performance_id_idx').on(table.performanceId),
    index('line_items_user_id_idx').on(table.userId),
    index('line_items_purchase_date_idx').on(table.purchaseDate),
  ],
);

// Tickets table - individual tickets with seat assignments
export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lineItemId: uuid('line_item_id')
      .references(() => lineItems.id, { onDelete: 'cascade' })
      .notNull(),
    performanceId: uuid('performance_id')
      .references(() => performances.id, { onDelete: 'cascade' })
      .notNull(),
    orderId: uuid('order_id')
      .references(() => orders.id, { onDelete: 'cascade' })
      .notNull(),
    ticketNumber: varchar('ticket_number', { length: 50 }).notNull().unique(),
    rowNumber: integer('row_number').notNull(), // 1, 2, 3, etc.
    seatNumber: integer('seat_number').notNull(), // 1, 2, 3, etc.
    wheelchairAccess: boolean('wheelchair_access').notNull().default(false),
    qrToken: uuid('qr_token').notNull().unique().defaultRandom(),
    scannedAt: timestamp('scanned_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('tickets_line_item_id_idx').on(table.lineItemId),
    index('tickets_performance_id_idx').on(table.performanceId),
    index('tickets_order_id_idx').on(table.orderId),
    index('tickets_qr_token_idx').on(table.qrToken),
    index('tickets_ticket_number_idx').on(table.ticketNumber),
  ],
);
