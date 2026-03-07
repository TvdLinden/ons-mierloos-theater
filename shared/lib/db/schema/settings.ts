import { pgTable, varchar, text, timestamp, index, uuid, integer, boolean } from 'drizzle-orm/pg-core';
import { images } from './images';

// Site Settings - general configuration
export const siteSettings = pgTable('site_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteName: varchar('site_name', { length: 255 }),
  siteDescription: text('site_description'),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactAddress: text('contact_address'),
  logoImageId: uuid('logo_image_id').references(() => images.id, { onDelete: 'set null' }),
  faviconImageId: uuid('favicon_image_id').references(() => images.id, { onDelete: 'set null' }),
  primaryColor: varchar('primary_color', { length: 7 }), // hex color #000000
  secondaryColor: varchar('secondary_color', { length: 7 }), // hex color #ffffff
  fontDisplay: varchar('font_display', { length: 50 }), // key from DISPLAY_FONTS catalogue
  fontBody: varchar('font_body', { length: 50 }), // key from BODY_FONTS catalogue
  smtpHost: varchar('smtp_host', { length: 255 }),
  smtpPort: integer('smtp_port'),
  smtpUser: varchar('smtp_user', { length: 255 }),
  smtpPassword: varchar('smtp_password', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Custom Code Snippets - injectable HTML/JS/CSS snippets for head and body
export const customCodeSnippets = pgTable(
  'custom_code_snippets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    location: varchar('location', { length: 20 }).notNull(), // 'head' | 'body_start' | 'body_end'
    html: text('html').notNull(),
    isEnabled: boolean('is_enabled').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('custom_code_snippets_location_idx').on(table.location),
    index('custom_code_snippets_is_enabled_idx').on(table.isEnabled),
    index('custom_code_snippets_sort_order_idx').on(table.sortOrder),
  ],
);

// SEO Settings - meta tags and social media
export const seoSettings = pgTable('seo_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  defaultTitle: varchar('default_title', { length: 255 }),
  defaultDescription: text('default_description'),
  defaultKeywords: text('default_keywords'),
  ogImage: varchar('og_image', { length: 500 }),
  ogType: varchar('og_type', { length: 50 }),
  twitterCard: varchar('twitter_card', { length: 50 }),
  twitterSite: varchar('twitter_site', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
