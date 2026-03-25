import {
  pgTable,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  uuid,
  integer,
  primaryKey,
  customType,
} from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: varchar('filename', { length: 255 }),
  mimetype: varchar('mimetype', { length: 100 }),
  r2Url: text('r2_url').notNull(), // R2 public URL (required after Phase 6)
  originalWidth: integer('original_width'), // Original image width
  originalHeight: integer('original_height'), // Original image height
  focalPoints: jsonb('focal_points'), // Per-context focal points for cropping
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow(),
});

// Image usages - tracks which images are embedded in block content
export const imageUsages = pgTable(
  'image_usages',
  {
    imageId: uuid('image_id')
      .notNull()
      .references(() => images.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 50 }).notNull(), // 'show' | 'page'
    entityId: uuid('entity_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.imageId, table.entityType, table.entityId] }),
    index('image_usages_entity_idx').on(table.entityType, table.entityId),
  ],
);
