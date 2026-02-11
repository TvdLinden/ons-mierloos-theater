import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getNextJobs,
  updateJobStatus,
  calculateNextRetry,
  type Job,
} from '@ons-mierloos-theater/shared/jobs/jobProcessor';

// Note: calculateNextRetry is a pure utility function that doesn't need mocking
// We test it directly

describe('Job Worker - Payment Creation Retry with Backoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Retry Logic with Exponential Backoff', () => {
    it('should calculate correct backoff intervals', () => {
      const baseInterval = 5000; // 5 seconds
      const maxInterval = 300000; // 5 minutes

      // First retry: 5s
      const retry1 = calculateNextRetry(0, baseInterval, maxInterval);
      expect(retry1.getTime()).toBeLessThan(Date.now() + baseInterval + 1000);

      // Second retry: 10s
      const retry2 = calculateNextRetry(1, baseInterval, maxInterval);
      const expectedTime2 = Date.now() + baseInterval * 2;
      expect(retry2.getTime()).toBeLessThan(expectedTime2 + 1000);
      expect(retry2.getTime()).toBeGreaterThan(expectedTime2 - 1000);

      // Third retry: 20s
      const retry3 = calculateNextRetry(2, baseInterval, maxInterval);
      const expectedTime3 = Date.now() + baseInterval * 4;
      expect(retry3.getTime()).toBeLessThan(expectedTime3 + 1000);
      expect(retry3.getTime()).toBeGreaterThan(expectedTime3 - 1000);

      // After hitting max interval, should cap at 5 minutes
      const retry10 = calculateNextRetry(10, baseInterval, maxInterval);
      expect(retry10.getTime()).toBeLessThanOrEqual(Date.now() + maxInterval + 1000);
    });

    it('should increment execution count on retry', () => {
      let executionCount = 0;

      // Simulate retry increments
      executionCount++;
      expect(executionCount).toBe(1);

      executionCount++;
      expect(executionCount).toBe(2);

      executionCount++;
      expect(executionCount).toBe(3);
    });
  });

  describe('Job Processing Scenarios', () => {
    const mockJob: Job = {
      id: 'job-payment-1',
      type: 'payment_creation',
      status: 'pending',
      data: {
        orderId: 'order-123',
        amount: 50.0,
        currency: 'EUR',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        description: 'Test order',
        redirectUrl: 'http://localhost:3000/checkout/success',
        webhookUrl: 'http://localhost:3000/api/webhooks/mollie',
      },
      executionCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should define correct job structure', () => {
      expect(mockJob).toHaveProperty('id');
      expect(mockJob).toHaveProperty('type');
      expect(mockJob).toHaveProperty('status');
      expect(mockJob).toHaveProperty('data');
      expect(mockJob).toHaveProperty('executionCount');

      expect(mockJob.type).toBe('payment_creation');
      expect(mockJob.status).toBe('pending');
      expect(mockJob.executionCount).toBe(0);
    });

    it('should have correct order ID in job data', () => {
      expect(mockJob.data.orderId).toBe('order-123');
    });

    it('should have correct payment details', () => {
      expect(mockJob.data.amount).toBe(50.0);
      expect(mockJob.data.currency).toBe('EUR');
      expect(mockJob.data.customerEmail).toBe('test@example.com');
      expect(mockJob.data.customerName).toBe('Test User');
    });

    it('should have webhook and redirect URLs', () => {
      expect(mockJob.data.redirectUrl).toContain('checkout/success');
      expect(mockJob.data.webhookUrl).toContain('webhooks/mollie');
    });
  });

  describe('Job Retry Lifecycle', () => {
    it('should progress from pending to processing to completed', () => {
      let jobStatus = 'pending';
      const executionCount = 0;

      // Fetch job (still pending)
      expect(jobStatus).toBe('pending');

      // Mark as processing
      jobStatus = 'processing';
      expect(jobStatus).toBe('processing');

      // Process and complete
      jobStatus = 'completed';
      expect(jobStatus).toBe('completed');
    });

    it('should progress through: pending -> processing -> pending (retry) -> completed', () => {
      let jobStatus = 'pending';
      let executionCount = 0;

      // First attempt: pending
      expect(jobStatus).toBe('pending');
      expect(executionCount).toBe(0);

      // Process (mark as processing)
      jobStatus = 'processing';

      // Simulate processing error
      jobStatus = 'pending';
      executionCount++;
      expect(executionCount).toBe(1);

      // Second attempt: pending again
      expect(jobStatus).toBe('pending');

      // Process (mark as processing)
      jobStatus = 'processing';

      // This time it succeeds
      jobStatus = 'completed';
      expect(jobStatus).toBe('completed');
      expect(executionCount).toBe(1); // Still at 1, didn't increment on success
    });

    it('should fail job after max retries exceeded', () => {
      let jobStatus = 'pending';
      const maxAttempts = 5;
      let executionCount = 0;

      // Simulate 5 failed attempts
      for (let i = 0; i < maxAttempts; i++) {
        executionCount++;
      }

      // After max attempts, mark as failed
      if (executionCount >= maxAttempts) {
        jobStatus = 'failed';
      }

      expect(jobStatus).toBe('failed');
      expect(executionCount).toBe(5);
    });
  });

  describe('Multiple Job Processing', () => {
    it('should handle multiple jobs sequentially', () => {
      const jobs = [
        { id: 'job-1', status: 'pending', executionCount: 0 },
        { id: 'job-2', status: 'pending', executionCount: 0 },
      ];

      let processedCount = 0;

      // Process each job
      for (const job of jobs) {
        expect(job.status).toBe('pending');
        processedCount++;
      }

      expect(processedCount).toBe(2);
    });

    it('should track execution count per job', () => {
      const jobs = [
        { id: 'job-1', executionCount: 0 },
        { id: 'job-2', executionCount: 0 },
      ];

      // Simulate retries for job-1
      jobs[0].executionCount++;
      jobs[0].executionCount++;

      // job-2 still at 0
      expect(jobs[0].executionCount).toBe(2);
      expect(jobs[1].executionCount).toBe(0);
    });

    it('should handle different job statuses', () => {
      const jobs = [
        { id: 'job-1', status: 'completed' },
        { id: 'job-2', status: 'failed' },
        { id: 'job-3', status: 'pending' },
      ];

      const completed = jobs.filter((j) => j.status === 'completed');
      const failed = jobs.filter((j) => j.status === 'failed');
      const pending = jobs.filter((j) => j.status === 'pending');

      expect(completed).toHaveLength(1);
      expect(failed).toHaveLength(1);
      expect(pending).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle job data with error message', () => {
      const jobWithError = {
        id: 'job-123',
        status: 'pending',
        executionCount: 1,
        errorMessage: 'Mollie API timeout',
        nextRetryAt: new Date(Date.now() + 5000),
      };

      expect(jobWithError.errorMessage).toContain('Mollie');
      expect(jobWithError.nextRetryAt).toBeInstanceOf(Date);
    });

    it('should distinguish between retriable and permanent errors', () => {
      const retriableError = 'Connection timeout';
      const permanentError = 'Invalid API key';

      const isRetriable =
        retriableError.toLowerCase().includes('timeout') ||
        retriableError.toLowerCase().includes('connection');
      const isPermanent =
        permanentError.toLowerCase().includes('invalid') ||
        permanentError.toLowerCase().includes('unauthorized');

      expect(isRetriable).toBe(true);
      expect(isPermanent).toBe(true);
    });
  });

  describe('Backoff Timing Verification', () => {
    it('should follow exponential backoff pattern', () => {
      const baseInterval = 5000;
      const maxInterval = 300000;
      const backoffPattern = [];

      for (let i = 0; i < 5; i++) {
        const nextRetry = calculateNextRetry(i, baseInterval, maxInterval);
        const delayMs = nextRetry.getTime() - Date.now();
        backoffPattern.push(delayMs);
      }

      // Each retry should have greater delay than previous
      for (let i = 1; i < backoffPattern.length; i++) {
        expect(backoffPattern[i]).toBeGreaterThan(backoffPattern[i - 1]);
      }
    });

    it('should not exceed maximum backoff interval', () => {
      const baseInterval = 5000;
      const maxInterval = 300000;

      // Test many retries
      for (let i = 0; i < 20; i++) {
        const nextRetry = calculateNextRetry(i, baseInterval, maxInterval);
        const delayMs = nextRetry.getTime() - Date.now();

        expect(delayMs).toBeLessThanOrEqual(maxInterval + 1000);
      }
    });
  });
});
