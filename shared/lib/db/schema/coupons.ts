import { pgTable, pgEnum, varchar, text, decimal, timestamp, index, uuid, integer, primaryKey, boolean } from 'drizzle-orm/pg-core';
import { performances } from './shows';
import { orders } from './orders';
import { users } from './users';

const couponDiscountTypeValues = ['percentage', 'fixed', 'free_tickets'] as const;
type CouponDiscountType = (typeof couponDiscountTypeValues)[number];

export const couponDiscountType = pgEnum(
  'coupon_discount_type',
  couponDiscountTypeValues as unknown as [CouponDiscountType, ...CouponDiscountType[]],
);

// Coupons table
export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    description: text('description'),
    discountType: couponDiscountType('discount_type').notNull(),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(), // percentage or fixed amount
    minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }), // minimum order total to apply
    maxUses: integer('max_uses'), // null = unlimited
    maxUsesPerUser: integer('max_uses_per_user'), // null = unlimited per user
    usageCount: integer('usage_count').default(0).notNull(),
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    isActive: integer('is_active').default(1).notNull(), // 1 = active, 0 = inactive
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('coupons_code_idx').on(table.code),
    index('coupons_is_active_idx').on(table.isActive),
    index('coupons_valid_from_idx').on(table.validFrom),
    index('coupons_valid_until_idx').on(table.validUntil),
  ],
);

// Coupon performances - optional link to specific performances
export const couponPerformances = pgTable(
  'coupon_performances',
  {
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    performanceId: uuid('performance_id')
      .notNull()
      .references(() => performances.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.couponId, table.performanceId] }),
    index('coupon_performances_coupon_id_idx').on(table.couponId),
    index('coupon_performances_performance_id_idx').on(table.performanceId),
  ],
);

// Coupon usage tracking
export const couponUsages = pgTable(
  'coupon_usages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    couponId: uuid('coupon_id')
      .notNull()
      .references(() => coupons.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id),
    discountType: couponDiscountType('discount_type').notNull().default('fixed'), // 'percentage', 'fixed', or 'free_tickets'
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(), // Actual monetary value given to customer
    usedAt: timestamp('used_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('coupon_usages_coupon_id_idx').on(table.couponId),
    index('coupon_usages_order_id_idx').on(table.orderId),
    index('coupon_usages_user_id_idx').on(table.userId),
    index('coupon_usages_used_at_idx').on(table.usedAt),
  ],
);
