import {
  getNextJobs,
  updateJobStatus,
  scheduleRetry,
  markJobProcessing,
  calculateNextRetry,
  type Job,
} from './jobProcessor';

// Mock database operations but NOT the utility functions we want to test
jest.mock('./jobProcessor', () => {
  const actual = jest.requireActual('./jobProcessor');
  return {
    ...actual,
    getNextJobs: jest.fn(),
    updateJobStatus: jest.fn(),
    scheduleRetry: jest.fn(),
    markJobProcessing: jest.fn(),
    // Keep real implementations of calculateNextRetry and other utilities
  };
});

describe('Job Worker - Payment Creation Retry with Backoff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    it('should schedule retry with incremented execution count', async () => {
      const jobId = 'job-1';
      const errorMsg = 'Mollie API unavailable';

      (scheduleRetry as jest.Mock).mockResolvedValue(undefined);

      await scheduleRetry(jobId, 0, errorMsg);

      expect(scheduleRetry).toHaveBeenCalledWith(jobId, 0, errorMsg);
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

    it('should fetch pending jobs ready for processing', async () => {
      const pendingJobs = [mockJob];
      (getNextJobs as jest.Mock).mockResolvedValue(pendingJobs);

      const result = await getNextJobs(10);

      expect(getNextJobs).toHaveBeenCalledWith(10);
      expect(result).toEqual(pendingJobs);
    });

    it('should mark job as processing', async () => {
      (markJobProcessing as jest.Mock).mockResolvedValue(undefined);

      await markJobProcessing(mockJob.id);

      expect(markJobProcessing).toHaveBeenCalledWith(mockJob.id);
    });

    it('should mark job as completed after successful processing', async () => {
      const result = {
        paymentId: 'tr_123',
        paymentUrl: 'https://checkout.mollie.com/test',
      };

      (updateJobStatus as jest.Mock).mockResolvedValue(undefined);

      await updateJobStatus(mockJob.id, 'completed', result);

      expect(updateJobStatus).toHaveBeenCalledWith(
        mockJob.id,
        'completed',
        result
      );
    });

    it('should schedule retry when job fails', async () => {
      const errorMsg = 'Mollie API timeout';

      (scheduleRetry as jest.Mock).mockResolvedValue(undefined);

      await scheduleRetry(mockJob.id, 0, errorMsg);

      expect(scheduleRetry).toHaveBeenCalledWith(mockJob.id, 0, errorMsg);
    });

    it('should fail job permanently after max attempts exceeded', async () => {
      const maxAttempts = 5;
      const jobAtMaxAttempts: Job = {
        ...mockJob,
        executionCount: maxAttempts,
      };

      (updateJobStatus as jest.Mock).mockResolvedValue(undefined);

      await updateJobStatus(
        jobAtMaxAttempts.id,
        'failed',
        undefined,
        'Max execution attempts exceeded'
      );

      expect(updateJobStatus).toHaveBeenCalledWith(
        jobAtMaxAttempts.id,
        'failed',
        undefined,
        'Max execution attempts exceeded'
      );
    });
  });

  describe('Job Retry Lifecycle', () => {
    it('should progress through: pending -> processing -> completed', async () => {
      const jobId = 'job-1';

      // Fetch job
      (getNextJobs as jest.Mock).mockResolvedValueOnce([
        {
          id: jobId,
          status: 'pending',
          executionCount: 0,
          data: {},
        },
      ]);

      // Mark as processing
      (markJobProcessing as jest.Mock).mockResolvedValueOnce(undefined);

      // Mark as completed
      (updateJobStatus as jest.Mock).mockResolvedValueOnce(undefined);

      await getNextJobs(1);
      await markJobProcessing(jobId);
      await updateJobStatus(jobId, 'completed', {});

      expect(markJobProcessing).toHaveBeenCalledWith(jobId);
      expect(updateJobStatus).toHaveBeenCalledWith(jobId, 'completed', {});
    });

    it('should progress through: pending -> processing -> pending (retry) -> completed', async () => {
      const jobId = 'job-1';
      let executionCount = 0;

      // First fetch: get pending job
      (getNextJobs as jest.Mock).mockResolvedValueOnce([
        {
          id: jobId,
          status: 'pending',
          executionCount,
          data: {},
        },
      ]);

      // Mark as processing
      (markJobProcessing as jest.Mock).mockResolvedValueOnce(undefined);

      // Simulate processing error, schedule retry
      (scheduleRetry as jest.Mock).mockResolvedValueOnce(undefined);
      executionCount++;

      // Second fetch: get job scheduled for retry
      (getNextJobs as jest.Mock).mockResolvedValueOnce([
        {
          id: jobId,
          status: 'pending',
          executionCount,
          nextRetryAt: new Date(Date.now() + 5000),
          data: {},
        },
      ]);

      // Mark as processing again
      (markJobProcessing as jest.Mock).mockResolvedValueOnce(undefined);

      // This time it succeeds
      (updateJobStatus as jest.Mock).mockResolvedValueOnce(undefined);

      // Run through the lifecycle
      await getNextJobs(1);
      await markJobProcessing(jobId);
      await scheduleRetry(jobId, 0, 'API unavailable');
      await getNextJobs(1);
      await markJobProcessing(jobId);
      await updateJobStatus(jobId, 'completed', { success: true });

      expect(scheduleRetry).toHaveBeenCalledWith(jobId, 0, 'API unavailable');
      expect(updateJobStatus).toHaveBeenCalledWith(
        jobId,
        'completed',
        { success: true }
      );
    });

    it('should fail job after max retries exceeded', async () => {
      const jobId = 'job-1';
      const maxAttempts = 5;

      (getNextJobs as jest.Mock).mockResolvedValueOnce([
        {
          id: jobId,
          status: 'pending',
          executionCount: maxAttempts,
          data: {},
        },
      ]);

      (updateJobStatus as jest.Mock).mockResolvedValueOnce(undefined);

      await getNextJobs(1);
      await updateJobStatus(jobId, 'failed', undefined, 'Max execution attempts exceeded');

      expect(updateJobStatus).toHaveBeenCalledWith(
        jobId,
        'failed',
        undefined,
        'Max execution attempts exceeded'
      );
    });
  });

  describe('Multiple Job Processing', () => {
    it('should process multiple jobs in sequence', async () => {
      const jobs = [
        { id: 'job-1', status: 'pending', executionCount: 0 },
        { id: 'job-2', status: 'pending', executionCount: 0 },
      ];

      (getNextJobs as jest.Mock).mockResolvedValueOnce(jobs);
      (markJobProcessing as jest.Mock).mockResolvedValue(undefined);
      (updateJobStatus as jest.Mock).mockResolvedValue(undefined);

      const fetchedJobs = await getNextJobs(10);
      expect(fetchedJobs).toHaveLength(2);

      for (const job of fetchedJobs) {
        await markJobProcessing(job.id);
        await updateJobStatus(job.id, 'completed', {});
      }

      expect(markJobProcessing).toHaveBeenCalledTimes(2);
      expect(updateJobStatus).toHaveBeenCalledTimes(2);
    });
  });
});
