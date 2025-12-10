import { relations } from 'drizzle-orm';
import { decimal, uuid, customType, index, primaryKey } from 'drizzle-orm/pg-core';
import { pgTable, pgEnum, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';

const showStatusValues = ['draft', 'published', 'archived'] as const;
type ShowStatus = (typeof showStatusValues)[number];

export const showStatus = pgEnum(
  'show_status',
  showStatusValues as unknown as [ShowStatus, ...ShowStatus[]],
);

const performanceStatusValues = [
  'draft',
  'published',
  'sold_out',
  'cancelled',
  'archived',
] as const;
type PerformanceStatus = (typeof performanceStatusValues)[number];

export const performanceStatus = pgEnum(
  'performance_status',
  performanceStatusValues as unknown as [PerformanceStatus, ...PerformanceStatus[]],
);

// Shows table - represents the production/content
export const shows = pgTable(
  'shows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    subtitle: varchar('subtitle', { length: 255 }),
    slug: varchar('slug', { length: 255 }).unique().notNull(),
    description: text('description'),
    imageId: uuid('image_id').references(() => images.id, { onDelete: 'set null' }),
    thumbnailImageId: uuid('thumbnail_image_id').references(() => images.id, {
      onDelete: 'set null',
    }),
    basePrice: decimal('base_price', { precision: 8, scale: 2 }),
    status: showStatus('status').default('draft').notNull(),
    publicationDate: timestamp('publication_date', { withTimezone: true }),
    depublicationDate: timestamp('depublication_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('shows_title_idx').on(table.title),
    index('shows_slug_idx').on(table.slug),
    index('shows_status_idx').on(table.status),
    index('shows_publication_date_idx').on(table.publicationDate),
  ],
);

// Performances table - specific time slots for shows
export const performances = pgTable(
  'performances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    showId: uuid('show_id')
      .references(() => shows.id, { onDelete: 'cascade' })
      .notNull(),
    date: timestamp('date', { withTimezone: true }).notNull(),
    price: decimal('price', { precision: 8, scale: 2 }), // Can override show base price
    totalSeats: integer('total_seats').default(100),
    availableSeats: integer('available_seats').default(100),
    status: performanceStatus('status').default('draft').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('performances_show_id_idx').on(table.showId),
    index('performances_date_idx').on(table.date),
    index('performances_status_idx').on(table.status),
  ],
);

const userRoleValues = ['user', 'admin', 'contributor'] as const;
type UserRole = (typeof userRoleValues)[number];
export const userRole = pgEnum('user_role', userRoleValues as unknown as [UserRole, ...UserRole[]]);
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }),
    email: varchar('email', { length: 255 }).unique(),
    passwordHash: varchar('password_hash', { length: 255 }),
    role: userRole('role').default('user'),
    emailVerified: timestamp('email_verified', { withTimezone: true }),
    verificationToken: varchar('verification_token', { length: 255 }),
    resetToken: varchar('reset_token', { length: 255 }),
    resetTokenExpiry: timestamp('reset_token_expiry', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    lastSignin: timestamp('last_signin', { withTimezone: true }),
  },
  (table) => [index('users_email_idx').on(table.email), index('users_role_idx').on(table.role)],
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
  },
  (table) => [
    index('line_items_order_id_idx').on(table.orderId),
    index('line_items_performance_id_idx').on(table.performanceId),
    index('line_items_user_id_idx').on(table.userId),
    index('line_items_purchase_date_idx').on(table.purchaseDate),
  ],
);

// You can add more tables as needed, e.g., for tickets, payments, etc.
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 255 }),
  mimetype: varchar('mimetype', { length: 100 }),
  data: bytea('data'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
});

// Tags table for categorizing shows
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('tags_slug_idx').on(table.slug)],
);

// Many-to-many relationship between shows and tags
export const showTags = pgTable(
  'show_tags',
  {
    showId: uuid('show_id')
      .notNull()
      .references(() => shows.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.showId, table.tagId] }),
    index('show_tags_show_id_idx').on(table.showId),
    index('show_tags_tag_id_idx').on(table.tagId),
  ],
);

// Mailing list subscribers
export const mailingListSubscribers = pgTable(
  'mailing_list_subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 100 }),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
    isActive: integer('is_active').default(1).notNull(), // 1 = active, 0 = unsubscribed
  },
  (table) => [
    index('mailing_list_email_idx').on(table.email),
    index('mailing_list_is_active_idx').on(table.isActive),
  ],
);

// Order status enum
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

// Payment transactions table
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

// Sponsors table
const sponsorTierValues = ['gold', 'silver', 'bronze'] as const;
type SponsorTier = (typeof sponsorTierValues)[number];
export const sponsorTier = pgEnum(
  'sponsor_tier',
  sponsorTierValues as unknown as [SponsorTier, ...SponsorTier[]],
);

export const sponsors = pgTable(
  'sponsors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    logoId: uuid('logo_id').references(() => images.id, { onDelete: 'set null' }),
    website: varchar('website', { length: 500 }),
    tier: sponsorTier('tier').default('bronze').notNull(),
    displayOrder: integer('display_order').default(0),
    active: integer('active').default(1).notNull(), // 1 = active, 0 = inactive
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('sponsors_tier_idx').on(table.tier),
    index('sponsors_active_idx').on(table.active),
    index('sponsors_display_order_idx').on(table.displayOrder),
  ],
);

// Coupon discount type enum
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
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('coupon_usages_coupon_id_idx').on(table.couponId),
    index('coupon_usages_order_id_idx').on(table.orderId),
    index('coupon_usages_user_id_idx').on(table.userId),
    index('coupon_usages_used_at_idx').on(table.usedAt),
  ],
);

// Relations
export const showsRelations = relations(shows, ({ many, one }) => ({
  image: one(images, { fields: [shows.imageId], references: [images.id] }),
  thumbnailImage: one(images, {
    fields: [shows.thumbnailImageId],
    references: [images.id],
  }),
  performances: many(performances),
  showTags: many(showTags),
}));

export const performancesRelations = relations(performances, ({ one, many }) => ({
  show: one(shows, { fields: [performances.showId], references: [shows.id] }),
  lineItems: many(lineItems),
  couponPerformances: many(couponPerformances),
}));

export const usersRelations = relations(users, ({ many }) => ({
  lineItems: many(lineItems),
  orders: many(orders),
}));

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  performance: one(performances, {
    fields: [lineItems.performanceId],
    references: [performances.id],
  }),
  user: one(users, { fields: [lineItems.userId], references: [users.id] }),
  order: one(orders, { fields: [lineItems.orderId], references: [orders.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  lineItems: many(lineItems),
  payments: many(payments),
  couponUsages: many(couponUsages),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  showTags: many(showTags),
}));

export const showTagsRelations = relations(showTags, ({ one }) => ({
  show: one(shows, {
    fields: [showTags.showId],
    references: [shows.id],
  }),
  tag: one(tags, { fields: [showTags.tagId], references: [tags.id] }),
}));

export const sponsorsRelations = relations(sponsors, ({ one }) => ({
  logo: one(images, { fields: [sponsors.logoId], references: [images.id] }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  couponPerformances: many(couponPerformances),
  couponUsages: many(couponUsages),
}));

export const couponPerformancesRelations = relations(couponPerformances, ({ one }) => ({
  coupon: one(coupons, { fields: [couponPerformances.couponId], references: [coupons.id] }),
  performance: one(performances, {
    fields: [couponPerformances.performanceId],
    references: [performances.id],
  }),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, { fields: [couponUsages.couponId], references: [coupons.id] }),
  order: one(orders, { fields: [couponUsages.orderId], references: [orders.id] }),
  user: one(users, { fields: [couponUsages.userId], references: [users.id] }),
}));

const pageStatusValues = ['draft', 'published', 'archived'] as const;
type PageStatus = (typeof pageStatusValues)[number];
export const pageStatus = pgEnum(
  'page_status',
  pageStatusValues as unknown as [PageStatus, ...PageStatus[]],
);

// Pages
export const pages = pgTable(
  'pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).unique().notNull(),
    content: text('content'),
    status: pageStatus('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('pages_title_idx').on(table.title), index('pages_slug_idx').on(table.slug)],
);
