import { pgTable, pgEnum, varchar, text, timestamp, index, uuid, integer, jsonb } from 'drizzle-orm/pg-core';
import { images } from './images';

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
    blocks: jsonb('blocks'),
    status: pageStatus('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('pages_title_idx').on(table.title), index('pages_slug_idx').on(table.slug)],
);

// Navigation Links - for header and footer
const linkLocationValues = ['header', 'footer'] as const;
type LinkLocation = (typeof linkLocationValues)[number];

export const linkLocation = pgEnum(
  'link_location',
  linkLocationValues as unknown as [LinkLocation, ...LinkLocation[]],
);

export const navigationLinks = pgTable(
  'navigation_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    label: varchar('label', { length: 100 }).notNull(),
    href: varchar('href', { length: 500 }).notNull(),
    location: linkLocation('location').notNull(), // 'header' or 'footer'
    displayOrder: integer('display_order').default(0).notNull(),
    active: integer('active').default(1).notNull(), // 1 = active, 0 = inactive
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('navigation_links_location_idx').on(table.location),
    index('navigation_links_display_order_idx').on(table.displayOrder),
    index('navigation_links_active_idx').on(table.active),
  ],
);

// Homepage Content
export const homepageContent = pgTable('homepage_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  introTitle: varchar('intro_title', { length: 255 }),
  introText: text('intro_text'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// News Articles for homepage
export const newsArticles = pgTable(
  'news_articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).unique().notNull(),
    content: text('content').notNull(),
    imageId: uuid('image_id').references(() => images.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    active: integer('active').default(1).notNull(), // 1 = active, 0 = inactive
    displayOrder: integer('display_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('news_articles_published_at_idx').on(table.publishedAt),
    index('news_articles_active_idx').on(table.active),
    index('news_articles_display_order_idx').on(table.displayOrder),
    index('news_articles_slug_idx').on(table.slug),
  ],
);

// Social Media Links
export const socialMediaLinks = pgTable(
  'social_media_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    platform: varchar('platform', { length: 50 }).notNull(), // e.g., 'facebook', 'instagram', 'youtube'
    url: varchar('url', { length: 500 }).notNull(),
    displayOrder: integer('display_order').default(0).notNull(),
    active: integer('active').default(1).notNull(), // 1 = active, 0 = inactive
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('social_media_links_display_order_idx').on(table.displayOrder),
    index('social_media_links_active_idx').on(table.active),
  ],
);

// Mailing list subscribers
export const mailingListSubscribers = pgTable(
  'mailing_list_subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 100 }),
    unsubscribeToken: varchar('unsubscribe_token', { length: 255 }),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow(),
    unsubscribedAt: timestamp('unsubscribed_at', { withTimezone: true }),
    isActive: integer('is_active').default(1).notNull(), // 1 = active, 0 = unsubscribed
  },
  (table) => [
    index('mailing_list_email_idx').on(table.email),
    index('mailing_list_unsubscribe_token_idx').on(table.unsubscribeToken),
    index('mailing_list_is_active_idx').on(table.isActive),
  ],
);
