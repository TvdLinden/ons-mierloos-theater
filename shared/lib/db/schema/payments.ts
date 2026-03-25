import {
  pgTable,
  pgEnum,
  varchar,
  text,
  decimal,
  timestamp,
  index,
  uuid,
} from 'drizzle-orm/pg-core';
import { orders } from './orders';

const paymentStatusValues = ['pending', 'processing', 'succeeded', 'failed', 'cancelled'] as const;
type PaymentStatus = (typeof paymentStatusValues)[number];

export const paymentStatus = pgEnum(
  'payment_status',
  paymentStatusValues as unknown as [PaymentStatus, ...PaymentStatus[]],
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('EUR').notNull(),
    status: paymentStatus('status').default('pending').notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }), // e.g., 'ideal', 'creditcard', 'bancontact'
    paymentProvider: varchar('payment_provider', { length: 50 }), // e.g., 'stripe', 'mollie'
    providerTransactionId: varchar('provider_transaction_id', { length: 255 }), // External payment ID
    providerPaymentUrl: text('provider_payment_url'), // Redirect URL for payment
    metadata: text('metadata'), // JSON string for additional payment data
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('payments_order_id_idx').on(table.orderId),
    index('payments_status_idx').on(table.status),
    index('payments_provider_transaction_id_idx').on(table.providerTransactionId),
  ],
);
