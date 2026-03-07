import { pgTable, varchar, text, timestamp, index, uuid, boolean } from 'drizzle-orm/pg-core';

// --- Client Applications & Secrets for Machine-to-Machine Auth ---

export const clientApplications = pgTable('client_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 128 }).notNull(),
  clientId: varchar('client_id', { length: 64 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Scopes defined by an application
export const applicationDefinedScopes = pgTable(
  'application_defined_scopes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => clientApplications.id, { onDelete: 'cascade' }),
    scope: varchar('scope', { length: 128 }).notNull(), // e.g., 'sync:orders', 'sync:payments'
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('application_defined_scopes_application_id_idx').on(table.applicationId)],
);

// Permissions granted to an application to use scopes from another application
export const grantedPermissions = pgTable(
  'granted_permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    grantedToApplicationId: uuid('granted_to_application_id')
      .notNull()
      .references(() => clientApplications.id, { onDelete: 'cascade' }),
    definedScopeId: uuid('defined_scope_id')
      .notNull()
      .references(() => applicationDefinedScopes.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('granted_permissions_granted_to_application_id_idx').on(table.grantedToApplicationId),
    index('granted_permissions_defined_scope_id_idx').on(table.definedScopeId),
  ],
);

export const clientSecrets = pgTable('client_secrets', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientApplicationId: uuid('client_application_id')
    .notNull()
    .references(() => clientApplications.id, { onDelete: 'cascade' }),
  secretHash: varchar('secret_hash', { length: 255 }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
});
