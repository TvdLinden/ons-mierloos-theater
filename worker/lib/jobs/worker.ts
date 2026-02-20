import { Client } from 'pg';

import {
  getNextJobs,
  updateJobStatus,
  scheduleRetry,
  type Job,
} from '@ons-mierloos-theater/shared/jobs/jobProcessor';
import { handlePaymentCreation } from './handlers/paymentCreationHandler';
import { handlePaymentWebhook } from './handlers/paymentWebhookHandler';
import { handleOrphanedOrderCleanup } from './handlers/orphanedOrderCleanupHandler';

const MINUTE = 60 * 1000;
const POLLING_INTERVAL = parseInt(process.env.WORKER_POLLING_INTERVAL || '5000', 10);
const MAX_EXECUTION_ATTEMPTS = parseInt(process.env.WORKER_MAX_ATTEMPTS || '5', 10);
const MAX_BACKOFF_INTERVAL = MINUTE * 10; // 10 minutes

let wakeUp: (() => void) | null = null;
let listener: Client | null = null;
let listenerRetryCount = 0;
let pendingNotifications = false;
let isShuttingDown = false;

function exponentialBackoff(attempt: number, baseDelay = 1000, maxDelay = 30000): number {
  const delay = Math.min(baseDelay * 2 ** attempt, maxDelay);
  return delay;
}

async function setupListener() {
  listener = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  listener.on('error', async (err) => {
    console.error('❌ listener lost, reconnecting:', err);
    await reconnectListener();
  });

  await listener.connect();
  await listener.query('LISTEN job_notifications');
  listenerRetryCount = 0;

  listener.on('notification', (msg) => {
    if (msg.channel === 'job_notifications') {
      console.log('🔔 Received job notification');
      pendingNotifications = true;
      if (wakeUp) {
        wakeUp();
        wakeUp = null;
      }
    }
  });

  console.log('Listening for job notifications...');
}

async function reconnectListener() {
  try {
    listener?.removeAllListeners();
    await listener?.end();
  } catch {}

  listener = null;

  setTimeout(setupListener, exponentialBackoff(listenerRetryCount++, 2000, MINUTE * 5));
}

/**
 * Main worker function that polls database for jobs and processes them
 * Uses exponential backoff when no jobs are available
 */
export async function startWorker() {
  console.log('🚀 Starting job worker...');
  console.log(`📋 Polling interval: ${POLLING_INTERVAL}ms`);
  console.log(`🔁 Max attempts: ${MAX_EXECUTION_ATTEMPTS}`);
  await setupListener();

  let currentInterval = POLLING_INTERVAL;
  let jobCount = 0;

  while (!isShuttingDown) {
    try {
      const nextJobs = await getNextJobs(10);

      if (nextJobs.length === 0) {
        // No jobs, gradually increase polling interval to reduce DB load
        currentInterval = Math.min(currentInterval * 1.5, MAX_BACKOFF_INTERVAL);
        await waitForNotificationOrTimeout(currentInterval);
        continue;
      }

      console.log(`📋 Found ${nextJobs.length} jobs to process`);
      currentInterval = POLLING_INTERVAL; // Reset interval when jobs found

      // Process jobs sequentially to avoid overwhelming the system
      for (const job of nextJobs) {
        try {
          await processJob(job);
          jobCount++;
        } catch (error) {
          console.error(`❌ Error processing job ${job.id}:`, error);
          // Continue with next job
        }
      }
    } catch (error) {
      console.error('💥 Worker error:', error);
      // Increase interval on critical error
      currentInterval = Math.min(currentInterval * 2, MAX_BACKOFF_INTERVAL);
    }

    await waitForNotificationOrTimeout(currentInterval);
  }
}

/**
 * Process a single job
 * Routes to appropriate handler based on job type
 */
async function processJob(job: Job): Promise<void> {
  const { id, type, data, executionCount } = job;

  console.log(
    `[JOB_START] ${id} - Type: ${type}, Attempt: ${executionCount + 1}/${MAX_EXECUTION_ATTEMPTS}`,
  );

  // Check if max attempts exceeded
  if (executionCount >= MAX_EXECUTION_ATTEMPTS) {
    await updateJobStatus(id, 'failed', undefined, 'Max execution attempts exceeded');
    console.error(`❌ Job ${id} exceeded max retries`);
    return;
  }

  // Jobs are already marked as 'processing' by getNextJobs() atomically
  try {
    let result: any;

    // Route to appropriate handler based on job type
    switch (type) {
      case 'payment_creation':
        result = await handlePaymentCreation(id, data as any);
        break;

      case 'payment_webhook':
        result = await handlePaymentWebhook(id, data as any);
        break;

      case 'orphaned_order_cleanup':
        result = await handleOrphanedOrderCleanup(id, data as any);
        break;

      // Future job types
      // case 'pdf_generation':
      //   result = await handlePDFGeneration(id, data);
      //   break;

      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    // Mark as completed
    await updateJobStatus(id, 'completed', result);
    console.log(`✅ Job ${id} completed successfully`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (executionCount >= MAX_EXECUTION_ATTEMPTS - 1) {
      // Final attempt failed, mark as failed permanently
      await updateJobStatus(id, 'failed', undefined, errorMsg);
      console.error(`❌ Job ${id} failed permanently: ${errorMsg}`);
    } else {
      // Schedule retry with exponential backoff
      await scheduleRetry(id, executionCount, errorMsg);
      console.warn(
        `⚠️  Job ${id} failed (attempt ${executionCount + 1}/${MAX_EXECUTION_ATTEMPTS}), will retry`,
      );
    }
  }
}

function waitForNotificationOrTimeout(ms: number): Promise<void> {
  if (pendingNotifications) {
    pendingNotifications = false;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      wakeUp = null;
      resolve();
    }, ms);

    // If a notification is received, wake up immediately
    wakeUp = () => {
      clearTimeout(timeout);

      if (pendingNotifications) {
        pendingNotifications = false;
      }
      wakeUp = null;
      resolve();
    };
  });
}

export function setupGracefulShutdown() {
  const shutdown = () => {
    if (isShuttingDown) return;

    isShuttingDown = true;
    console.log('\n🛑 Graceful shutdown initiated...');
    console.log('⏳ Waiting for current jobs to complete...');

    try {
      listener?.end();
      listener = null;
    } catch {}

    // Give jobs 30 seconds to complete
    setTimeout(() => {
      console.log('✅ Worker shutdown complete');
      process.exit(0);
    }, 30000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
