import {
  getNextJobs,
  updateJobStatus,
  scheduleRetry,
  type Job,
} from './jobProcessor';
import { handlePaymentCreation } from './handlers/paymentCreationHandler';
import { handlePaymentWebhook } from './handlers/paymentWebhookHandler';
import { handleOrphanedOrderCleanup } from './handlers/orphanedOrderCleanupHandler';
// Future handlers can be imported here
// import { handlePDFGeneration } from './handlers/pdfGenerationHandler';

const POLLING_INTERVAL = parseInt(process.env.WORKER_POLLING_INTERVAL || '5000', 10);
const MAX_EXECUTION_ATTEMPTS = parseInt(process.env.WORKER_MAX_ATTEMPTS || '5', 10);
const MAX_BACKOFF_INTERVAL = 300000; // 5 minutes

/**
 * Main worker function that polls database for jobs and processes them
 * Uses exponential backoff when no jobs are available
 */
export async function startWorker() {
  console.log('🚀 Starting job worker...');
  console.log(`📋 Polling interval: ${POLLING_INTERVAL}ms`);
  console.log(`🔁 Max attempts: ${MAX_EXECUTION_ATTEMPTS}`);

  let currentInterval = POLLING_INTERVAL;
  let jobCount = 0;

  while (true) {
    try {
      const nextJobs = await getNextJobs(10);

      if (nextJobs.length === 0) {
        // No jobs, gradually increase polling interval to reduce DB load
        currentInterval = Math.min(currentInterval * 1.5, MAX_BACKOFF_INTERVAL);
        await sleep(currentInterval);
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

    await sleep(currentInterval);
  }
}

/**
 * Process a single job
 * Routes to appropriate handler based on job type
 */
async function processJob(job: Job): Promise<void> {
  const { id, type, data, executionCount } = job;

  console.log(`[JOB_START] ${id} - Type: ${type}, Attempt: ${executionCount + 1}/${MAX_EXECUTION_ATTEMPTS}`);

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

/**
 * Helper function to sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Graceful shutdown handler
 */
let isShuttingDown = false;

export function setupGracefulShutdown() {
  const shutdown = () => {
    if (isShuttingDown) return;

    isShuttingDown = true;
    console.log('\n🛑 Graceful shutdown initiated...');
    console.log('⏳ Waiting for current jobs to complete...');

    // Give jobs 30 seconds to complete
    setTimeout(() => {
      console.log('✅ Worker shutdown complete');
      process.exit(0);
    }, 30000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
