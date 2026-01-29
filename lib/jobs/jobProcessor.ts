import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq, and, isNull, lte, or, inArray } from 'drizzle-orm';

export type JobType =
  | 'pdf_generation'
  | 'payment_creation'
  | 'payment_webhook'
  | 'orphaned_order_cleanup'
  | 'email';

export interface Job {
  id: string;
  type: JobType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: Record<string, any>;
  result?: Record<string, any>;
  errorMessage?: string | null;
  executionCount: number;
  nextRetryAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
}

/**
 * Create a new job in the database
 * @param type Job type
 * @param data Job-specific payload
 * @param priority Priority (higher = more important)
 * @returns Job ID
 */
export async function createJob(
  type: JobType,
  data: Record<string, any>,
  priority = 0,
): Promise<string> {
  const result = await db
    .insert(jobs)
    .values({
      type,
      status: 'pending',
      data,
      priority,
    })
    .returning({ id: jobs.id });

  console.log(`[JOB_CREATED] ${type} - ID: ${result[0].id}`);
  return result[0].id;
}

/**
 * Get next pending jobs ready for processing
 * Atomically fetches and marks jobs as 'processing' to prevent duplicate processing
 * in horizontally scaled worker environments
 * @param limit Maximum number of jobs to fetch
 * @returns Array of jobs marked as processing
 */
export async function getNextJobs(limit = 10): Promise<Job[]> {
  const now = new Date();

  return await db.transaction(async (tx) => {
    // Fetch pending jobs that are ready for retry
    const nextJobs = (await tx.query.jobs.findMany({
      where: and(
        eq(jobs.status, 'pending'),
        or(isNull(jobs.nextRetryAt), lte(jobs.nextRetryAt, now)),
      ),
      orderBy: (jobs, { desc, asc }) => [desc(jobs.priority), asc(jobs.createdAt)],
      limit,
    })) as Job[];

    // Atomically mark all fetched jobs as processing in same transaction
    // This prevents other workers from fetching the same jobs
    if (nextJobs.length > 0) {
      const jobIds = nextJobs.map((j) => j.id);
      await tx
        .update(jobs)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(inArray(jobs.id, jobIds));
    }

    return nextJobs;
  });
}

/**
 * Update job status and related fields
 * @param jobId Job ID
 * @param status New status
 * @param result Result data (for completed jobs)
 * @param errorMessage Error message (for failed jobs)
 */
export async function updateJobStatus(
  jobId: string,
  status: Job['status'],
  result?: Record<string, any>,
  errorMessage?: string,
): Promise<void> {
  const updates: any = {
    status,
    updatedAt: new Date(),
  };

  if (result) updates.result = result;
  if (errorMessage) updates.errorMessage = errorMessage;
  if (status === 'completed') updates.completedAt = new Date();

  await db.update(jobs).set(updates).where(eq(jobs.id, jobId));

  console.log(`[JOB_UPDATED] ${jobId} - Status: ${status}`);
}

/**
 * Calculate next retry time using exponential backoff
 * @param executionCount Number of previous execution attempts
 * @param baseInterval Base interval in milliseconds (default 5s)
 * @param maxInterval Maximum interval in milliseconds (default 5 minutes)
 * @returns Next retry date
 */
export function calculateNextRetry(
  executionCount: number,
  baseInterval = 5000,
  maxInterval = 300000,
): Date {
  const backoffMs = Math.min(baseInterval * Math.pow(2, executionCount), maxInterval);
  return new Date(Date.now() + backoffMs);
}

/**
 * Increment execution count and schedule next retry
 * @param jobId Job ID
 * @param executionCount Current execution count
 * @param errorMessage Error message
 */
export async function scheduleRetry(
  jobId: string,
  executionCount: number,
  errorMessage: string,
): Promise<void> {
  const nextRetry = calculateNextRetry(executionCount);

  await db
    .update(jobs)
    .set({
      status: 'pending',
      executionCount: executionCount + 1,
      nextRetryAt: nextRetry,
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId));

  console.log(
    `[JOB_RETRY_SCHEDULED] ${jobId} - Attempt ${executionCount + 1}, retry at ${nextRetry.toISOString()}`,
  );
}

/**
 * Mark job as processing (prevents concurrent processing)
 * @param jobId Job ID
 */
export async function markJobProcessing(jobId: string): Promise<void> {
  await db.update(jobs).set({ status: 'processing', updatedAt: new Date() }).where(eq(jobs.id, jobId));
}

/**
 * Get job by ID
 * @param jobId Job ID
 * @returns Job or null
 */
export async function getJobById(jobId: string): Promise<Job | null> {
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
  });

  return (job as Job) || null;
}

/**
 * Delete old completed/failed jobs (cleanup)
 * @param olderThanDays Delete jobs older than X days
 * @returns Number of deleted jobs
 */
export async function cleanupOldJobs(olderThanDays = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await db
    .delete(jobs)
    .where(
      and(
        or(eq(jobs.status, 'completed'), eq(jobs.status, 'failed')),
        lte(jobs.completedAt, cutoffDate),
      ),
    );

  console.log(`[JOB_CLEANUP] Deleted ${result.rowCount || 0} old jobs`);
  return result.rowCount || 0;
}
