import { pgTable, pgEnum, varchar, text, timestamp, index, uuid, integer, jsonb } from 'drizzle-orm/pg-core';

// Job status enum
const jobStatusValues = ['pending', 'processing', 'completed', 'failed'] as const;
type JobStatus = (typeof jobStatusValues)[number];

export const jobStatus = pgEnum(
  'job_status',
  jobStatusValues as unknown as [JobStatus, ...JobStatus[]],
);

// Jobs table - generic background job processing
export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: varchar('type', { length: 50 }).notNull(), // 'pdf_generation', 'payment_creation', 'payment_webhook', etc.
    status: jobStatus('status').default('pending').notNull(),
    priority: integer('priority').default(0),
    data: jsonb('data').notNull(), // Job-specific payload
    result: jsonb('result'), // Result data after completion
    errorMessage: text('error_message'),
    executionCount: integer('execution_count').default(0),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('jobs_type_status_idx').on(table.type, table.status),
    index('jobs_next_retry_at_idx').on(table.nextRetryAt),
    index('jobs_created_at_idx').on(table.createdAt),
    index('jobs_status_idx').on(table.status),
  ],
);
