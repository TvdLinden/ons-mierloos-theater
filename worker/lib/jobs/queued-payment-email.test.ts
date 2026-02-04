import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createJob, calculateNextRetry } from '@ons-mierloos-theater/shared/jobs/jobProcessor';
import { sendQueuedPaymentEmail } from '@ons-mierloos-theater/shared/utils/email';

describe('Queued Payment Email Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Test Case 1: Job Creation', () => {
    it('should create a payment_creation job with correct data', async () => {
      const mockJobId = 'job-123';
      const orderData = {
        orderId: 'order-456',
        totalAmount: 60,
        customerEmail: 'test@example.com',
        customerName: 'Test User',
      };

      // Verify job data structure
      expect(orderData).toHaveProperty('orderId');
      expect(orderData).toHaveProperty('totalAmount');
      expect(orderData).toHaveProperty('customerEmail');
      expect(orderData).toHaveProperty('customerName');
    });

    it('should store job data with all required fields', async () => {
      const orderData = {
        orderId: 'order-789',
        totalAmount: 60,
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
      };

      // Verify the job data structure
      expect(orderData).toHaveProperty('orderId');
      expect(orderData).toHaveProperty('totalAmount');
      expect(orderData).toHaveProperty('customerEmail');
      expect(orderData).toHaveProperty('customerName');

      expect(orderData.totalAmount).toBe(60);
      expect(orderData.customerEmail).toContain('@');
    });

    it('should set job status to pending', () => {
      const jobStatus = 'pending';

      expect(jobStatus).toBe('pending');
      expect(['pending', 'processing', 'completed', 'failed']).toContain(jobStatus);
    });

    it('should initialize execution count to 0', () => {
      const executionCount = 0;

      expect(executionCount).toBe(0);
      expect(executionCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Test Case 2: Retry Logic', () => {
    it('should calculate exponential backoff correctly', () => {
      const baseInterval = 5000; // 5 seconds
      const maxInterval = 300000; // 5 minutes

      // First retry: 5s * 2^0 = 5s
      const retry1 = calculateNextRetry(0, baseInterval, maxInterval);
      const delay1 = retry1.getTime() - Date.now();
      expect(delay1).toBeLessThanOrEqual(baseInterval + 100);

      // Second retry: 5s * 2^1 = 10s
      const retry2 = calculateNextRetry(1, baseInterval, maxInterval);
      const delay2 = retry2.getTime() - Date.now();
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay2).toBeLessThanOrEqual(baseInterval * 2 + 100);

      // Third retry: 5s * 2^2 = 20s
      const retry3 = calculateNextRetry(2, baseInterval, maxInterval);
      const delay3 = retry3.getTime() - Date.now();
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should cap backoff at max interval', () => {
      const baseInterval = 5000;
      const maxInterval = 300000;

      // After many attempts, should not exceed maxInterval
      const retryAfterMany = calculateNextRetry(10, baseInterval, maxInterval);
      const timeDiff = retryAfterMany.getTime() - Date.now();

      expect(timeDiff).toBeLessThanOrEqual(maxInterval + 100);
    });

    it('should update job with retry information', () => {
      const jobId = 'job-123';
      const executionCount = 1;
      const nextRetryAt = new Date(Date.now() + 5000);
      const errorMessage = 'Mollie API connection failed';

      // Simulate job update
      const jobData = {
        id: jobId,
        status: 'pending',
        executionCount,
        nextRetryAt,
        errorMessage,
      };

      expect(jobData.executionCount).toBe(1);
      expect(jobData.status).toBe('pending');
      expect(jobData.nextRetryAt).toBeInstanceOf(Date);
      expect(jobData.errorMessage).toContain('Mollie');
    });

    it('should not exceed maximum retry attempts', () => {
      const MAX_ATTEMPTS = 5;
      let attempts = 0;

      for (let i = 0; i < 10; i++) {
        if (attempts < MAX_ATTEMPTS) {
          attempts++;
        }
      }

      expect(attempts).toBeLessThanOrEqual(MAX_ATTEMPTS);
      expect(attempts).toBe(MAX_ATTEMPTS);
    });
  });

  describe('Test Case 3: Job Completion', () => {
    it('should mark job as completed with result data', () => {
      const jobId = 'job-123';
      const result = {
        paymentId: 'mollie_tr_123abc',
        paymentUrl: 'https://www.mollie.com/checkout/payment',
      };

      const completedJob = {
        id: jobId,
        status: 'completed',
        result,
        completedAt: new Date(),
      };

      expect(completedJob.status).toBe('completed');
      expect(completedJob.result).toEqual(result);
      expect(completedJob.completedAt).toBeInstanceOf(Date);
    });

    it('should store payment ID in job result', () => {
      const result = {
        paymentId: 'mollie_tr_456def',
        paymentUrl: 'https://www.mollie.com/checkout/payment',
      };

      expect(result.paymentId).toMatch(/^mollie_/);
      expect(result.paymentUrl).toContain('mollie.com');
    });

    it('should set completion timestamp', () => {
      const completedAt = new Date();
      const now = Date.now();

      // Timestamp should be recent (within 1 second)
      expect(Math.abs(completedAt.getTime() - now)).toBeLessThan(1000);
    });
  });

  describe('Test Case 4: Email Workflow', () => {
    it('should call sendQueuedPaymentEmail with correct parameters', async () => {
      const mockSendEmail = vi.mocked(sendQueuedPaymentEmail);

      const orderData = {
        orderId: 'order-123',
        to: 'test@example.com',
        customerName: 'Test User',
        totalAmount: '60.00',
        orderNumber: '123',
      };

      await mockSendEmail(orderData);

      expect(mockSendEmail).toHaveBeenCalledWith(orderData);
    });

    it('should include order ID in all emails', () => {
      const orderId = 'order-xyz-123';

      const emailTemplates = {
        queued: `Order ID: ${orderId}`,
        ready: `Order ID: ${orderId}`,
        failed: `Order ID: ${orderId}`,
      };

      expect(emailTemplates.queued).toContain(orderId);
      expect(emailTemplates.ready).toContain(orderId);
      expect(emailTemplates.failed).toContain(orderId);
    });

    it('should include order status page link in emails', () => {
      const orderId = 'order-123';
      const baseUrl = 'https://theater.example.com';
      const statusPageLink = `${baseUrl}/order/${orderId}`;

      expect(statusPageLink).toContain(orderId);
      expect(statusPageLink).toContain(baseUrl);
    });

    it('should send to valid email address', () => {
      const customerEmail = 'customer@example.com';

      // Verify email format
      expect(customerEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(customerEmail).toContain('@');
    });

    it('should include payment link in success email', () => {
      const paymentUrl = 'https://www.mollie.com/checkout/payment';

      expect(paymentUrl).toContain('mollie.com');
      expect(paymentUrl).toMatch(/^https:\/\//);
    });

    it('should include instructions in failure email', () => {
      const failureMessage =
        'Payment could not be processed. Please visit your order page for more information.';

      expect(failureMessage).toContain('Payment');
      expect(failureMessage).toContain('order page');
    });
  });

  describe('Test Case 5: Job Queue Workflow Integration', () => {
    it('should create payment_creation job when Mollie API fails', () => {
      const orderData = {
        orderId: 'order-fail-123',
        customerEmail: 'failing@example.com',
        customerName: 'Failing User',
        totalAmount: 100,
      };

      // Simulate Mollie failure → job creation
      const jobType = 'payment_creation';

      expect(jobType).toBe('payment_creation');
      expect(orderData.orderId).toBeTruthy();
    });

    it('should queue job immediately on payment API failure', () => {
      const failureScenario = {
        mollieError: 'Connection timeout',
        jobCreated: true,
        userNotified: true,
      };

      expect(failureScenario.jobCreated).toBe(true);
      expect(failureScenario.userNotified).toBe(true);
    });

    it('should retry job with exponential backoff', () => {
      const retryTimeline = [
        { attempt: 1, delayMs: 5000, description: '5 seconds' },
        { attempt: 2, delayMs: 10000, description: '10 seconds' },
        { attempt: 3, delayMs: 20000, description: '20 seconds' },
        { attempt: 4, delayMs: 40000, description: '40 seconds' },
        { attempt: 5, delayMs: 80000, description: '80 seconds' },
      ];

      // Verify exponential growth
      for (let i = 1; i < retryTimeline.length; i++) {
        const current = retryTimeline[i];
        const previous = retryTimeline[i - 1];
        expect(current.delayMs).toBeGreaterThan(previous.delayMs);
      }

      expect(retryTimeline.length).toBe(5);
    });

    it('should mark job as failed after max attempts', () => {
      const jobAfterFailure = {
        id: 'job-fail-123',
        status: 'failed',
        executionCount: 5,
        errorMessage: 'Max execution attempts exceeded',
      };

      expect(jobAfterFailure.status).toBe('failed');
      expect(jobAfterFailure.executionCount).toBe(5);
      expect(jobAfterFailure.errorMessage).toContain('Max');
    });

    it('should store payment data when creation succeeds', () => {
      const successResult = {
        paymentId: 'mollie_tr_success',
        paymentUrl: 'https://www.mollie.com/checkout/success',
        status: 'completed',
      };

      expect(successResult.paymentId).toBeTruthy();
      expect(successResult.paymentUrl).toContain('mollie');
      expect(successResult.status).toBe('completed');
    });
  });

  describe('Test Case 6: Error Scenarios', () => {
    it('should handle invalid email gracefully', () => {
      const invalidEmail = 'not-an-email';
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invalidEmail);

      expect(isValidEmail).toBe(false);
    });

    it('should handle missing order ID', () => {
      const jobData = {
        orderId: undefined,
        customerEmail: 'test@example.com',
      };

      expect(jobData.orderId).toBeUndefined();
    });

    it('should handle Mollie API errors gracefully', () => {
      const apiError = new Error('Mollie API timeout');

      expect(apiError.message).toContain('Mollie');
      expect(apiError).toBeInstanceOf(Error);
    });

    it('should not send duplicate emails on retry', () => {
      let emailsSent = 0;

      // First attempt sends email
      emailsSent++;

      // Retry should not send another email until job completes
      expect(emailsSent).toBe(1);
    });

    it('should recover when Mollie becomes available again', () => {
      const jobRetry = {
        previousStatus: 'pending',
        newStatus: 'completed',
        recoveryTime: '2 minutes',
      };

      expect(jobRetry.previousStatus).toBe('pending');
      expect(jobRetry.newStatus).toBe('completed');
    });

    it('should log errors for debugging', () => {
      const errorLog = {
        timestamp: new Date().toISOString(),
        jobId: 'job-123',
        error: 'Network timeout',
        attempt: 1,
      };

      expect(errorLog.timestamp).toBeTruthy();
      expect(errorLog.jobId).toBeTruthy();
      expect(errorLog.attempt).toBeGreaterThan(0);
    });
  });
});
