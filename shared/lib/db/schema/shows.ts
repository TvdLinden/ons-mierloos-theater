import {
  pgTable,
  pgEnum,
  varchar,
  text,
  decimal,
  timestamp,
  jsonb,
  index,
  uuid,
  integer,
} from 'drizzle-orm/pg-core';
import { images } from './images';

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
    blocks: jsonb('blocks'),
    imageId: uuid('image_id').references(() => images.id, { onDelete: 'set null' }),
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
    rows: integer('rows').default(5), // Number of rows in venue
    seatsPerRow: integer('seats_per_row').default(20), // Seats per row
    totalSeats: integer('total_seats').default(100), // Computed: rows × seatsPerRow
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
