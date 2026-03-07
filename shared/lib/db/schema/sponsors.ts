import { pgTable, pgEnum, varchar, timestamp, index, uuid, integer } from 'drizzle-orm/pg-core';
import { images } from './images';

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
