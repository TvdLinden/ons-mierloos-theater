import { handlePaymentCreation } from './paymentCreationHandler';
import { db } from '@/lib/db';

// Mock the Mollie client
jest.mock('@mollie/api-client');

describe('Payment Creation Handler - Mollie Provider Unavailable', () => {
  const mockOrderId = 'test-order-123';
  const mockPaymentId = 'tr_mock_payment_123';
  const mockCheckoutUrl = 'https://checkout.mollie.com/test';

  const jobData = {
    orderId: mockOrderId,
    amount: 50.0,
    currency: 'EUR',
    customerEmail: 'test@example.com',
    customerName: 'Test User',
    description: 'Test order',
    redirectUrl: 'http://localhost:3000/checkout/success?orderId=test-order-123',
    webhookUrl: 'http://localhost:3000/api/webhooks/mollie',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset module cache to pick up new environment variables
    jest.resetModules();
  });

  describe('Payment Creation Success', () => {
    it('should create payment with Mollie and store in database', async () => {
      const { createMollieClient } = require('@mollie/api-client');

      // Mock successful Mollie response
      createMollieClient.mockReturnValue({
        payments: {
          create: jest.fn().mockResolvedValue({
            id: mockPaymentId,
            getCheckoutUrl: jest.fn().mockReturnValue(mockCheckoutUrl),
          }),
        },
      });

      // Mock database insert
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockResolvedValue([{ id: 'payment-1' }]),
      });

      const result = await handlePaymentCreation('job-1', jobData);

      // Verify database insert was called
      expect(db.insert).toHaveBeenCalled();
      expect(result.paymentId).toBe(mockPaymentId);
      expect(result.paymentUrl).toBe(mockCheckoutUrl);
    });
  });

  describe('Payment Creation Failure - Mollie Unavailable', () => {
    it('should throw retryable error when Mollie API is unreachable', async () => {
      const { createMollieClient } = require('@mollie/api-client');

      // Mock Mollie unreachable error
      createMollieClient.mockReturnValue({
        payments: {
          create: jest
            .fn()
            .mockRejectedValue(new Error('Unable to reach Mollie API')),
        },
      });

      await expect(handlePaymentCreation('job-1', jobData)).rejects.toThrow(
        'Mollie API is unreachable - will retry'
      );
    });

    it('should throw retryable error when Mollie API times out', async () => {
      const { createMollieClient } = require('@mollie/api-client');

      // Mock timeout error
      createMollieClient.mockReturnValue({
        payments: {
          create: jest
            .fn()
            .mockRejectedValue(new Error('Request timeout after 30s')),
        },
      });

      await expect(handlePaymentCreation('job-1', jobData)).rejects.toThrow(
        'Mollie API timeout - will retry'
      );
    });

    it('should throw non-retryable error for invalid API key', async () => {
      const { createMollieClient } = require('@mollie/api-client');

      // Mock invalid API key error
      createMollieClient.mockReturnValue({
        payments: {
          create: jest
            .fn()
            .mockRejectedValue(new Error('Unauthorized: Invalid API key')),
        },
      });

      await expect(handlePaymentCreation('job-1', jobData)).rejects.toThrow(
        'Payment creation failed'
      );
    });
  });

  describe('Mock Payment Mode', () => {
    it('should create mock payment when USE_MOCK_PAYMENT is enabled', async () => {
      const originalEnv = process.env.USE_MOCK_PAYMENT;
      process.env.USE_MOCK_PAYMENT = 'true';

      // Mock database insert for mock payment
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockResolvedValue([{ id: 'payment-1' }]),
      });

      // Need to reload the module to pick up new USE_MOCK_PAYMENT value
      jest.isolateModulesAsync(async () => {
        const { handlePaymentCreation: handlerWithMock } = await import(
          './paymentCreationHandler'
        );
        const result = await handlerWithMock('job-1', jobData);

        expect(result.paymentId).toMatch(/^mock_/);
        expect(result.paymentUrl).toContain('/checkout/mock-payment');
      });

      process.env.USE_MOCK_PAYMENT = originalEnv;
    });
  });

  describe('Missing Configuration', () => {
    it('should throw error when MOLLIE_API_KEY is not configured', async () => {
      const originalKey = process.env.MOLLIE_API_KEY;
      delete process.env.MOLLIE_API_KEY;

      const { createMollieClient } = require('@mollie/api-client');
      createMollieClient.mockReturnValue({
        payments: {
          create: jest.fn(),
        },
      });

      await expect(handlePaymentCreation('job-1', jobData)).rejects.toThrow(
        'MOLLIE_API_KEY not configured'
      );

      process.env.MOLLIE_API_KEY = originalKey;
    });
  });
});
