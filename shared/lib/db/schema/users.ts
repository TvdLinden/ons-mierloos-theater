import { pgTable, pgEnum, varchar, timestamp, index, uuid } from 'drizzle-orm/pg-core';

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
