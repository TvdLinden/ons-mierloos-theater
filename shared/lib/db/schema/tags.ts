import { pgTable, varchar, text, timestamp, index, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { shows } from './shows';

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
