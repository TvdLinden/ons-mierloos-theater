/**
 * Integration tests for processCheckout
 *
 * Tests the complete checkout flow:
 * - Happy path: Order creation + immediate payment success
 * - Retry path: Order creation + payment provider failure + job queuing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processCheckout } from './actions';
import * as paymentCommands from '@ons-mierloos-theater/shared/commands/payments';
import * as jobProcessor from '@ons-mierloos-theater/shared/jobs/jobProcessor';
import * as emailUtils from '@ons-mierloos-theater/shared/utils/email';
import * as orderCommands from '@ons-mierloos-theater/shared/commands/orders';
import * as ticketSalesCommands from '@ons-mierloos-theater/shared/commands/ticketSales';
import * as mailingListCommands from '@ons-mierloos-theater/shared/commands/mailingList';

// Mock all external dependencies
vi.mock('@ons-mierloos-theater/shared/commands/payments');
vi.mock('@ons-mierloos-theater/shared/jobs/jobProcessor');
vi.mock('@ons-mierloos-theater/shared/utils/email');
vi.mock('@ons-mierloos-theater/shared/commands/orders');
vi.mock('@ons-mierloos-theater/shared/commands/ticketSales');
vi.mock('@ons-mierloos-theater/shared/commands/mailingList');
vi.mock('@ons-mierloos-theater/shared/queries/users', () => ({
  getUserByEmail: vi.fn().mockResolvedValue(null),
}));
vi.mock('@ons-mierloos-theater/shared/utils/couponValidation', () => ({
  validateCoupon: vi.fn().mockResolvedValue({ valid: false }),
}));

// Mock database
vi.mock('@ons-mierloos-theater/shared/db', () => {
  const mockPerformancesFindMany = vi.fn();
  const mockTransactionExecute = vi.fn();
  const mockTransactionInsert = vi.fn().mockReturnValue({ values: vi.fn() });

  const mockTx = {
    execute: mockTransactionExecute,
    insert: mockTransactionInsert,
    query: {
      performances: {
        findMany: vi.fn(),
      },
    },
  };

  const mockTransaction = vi.fn((callback) => callback(mockTx));

  return {
    db: {
      transaction: mockTransaction,
      query: {
        performances: {
          findMany: mockPerformancesFindMany,
        },
      },
    },
    mockTx,
    mockTransaction,
    mockPerformancesFindMany,
    mockTransactionExecute,
    mockTransactionInsert,
  };
});

// Get mocked db and mock functions
const dbModule = await import('@ons-mierloos-theater/shared/db');
const db = dbModule.db;
const mockTx = (dbModule as any).mockTx;
const mockPerformancesFindMany = (dbModule as any).mockPerformancesFindMany;
const mockTransactionExecute = (dbModule as any).mockTransactionExecute;
const mockTransactionInsert = (dbModule as any).mockTransactionInsert;

describe('processCheckout Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformancesFindMany.mockReset();
    mockTransactionExecute.mockReset();
    mockTransactionInsert.mockReset().mockReturnValue({ values: vi.fn() });
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  });

  describe('Happy Path - Payment succeeds immediately', () => {
    it('should create order, reserve seats, create payment, and redirect to payment URL', async () => {
      // Setup: Mock performance data
      mockPerformancesFindMany.mockResolvedValue([
        {
          id: 'perf-1',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'published',
          availableSeats: 100,
        },
      ]);

      // Setup: Mock order creation
      const mockOrder = {
        id: 'order-123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        totalAmount: '35.00',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
      };
      vi.mocked(orderCommands.createOrder).mockResolvedValue(mockOrder as any);

      // Setup: Mock line items creation
      vi.mocked(ticketSalesCommands.createLineItems).mockResolvedValue([]);

      // Setup: Mock SELECT ... FOR UPDATE (locked performances)
      mockTransactionExecute.mockResolvedValueOnce({
        rows: [{ id: 'perf-1', available_seats: 100 }],
      });

      // Setup: Mock seat update
      mockTransactionExecute.mockResolvedValueOnce(undefined);

      // Setup: Mock successful payment creation
      vi.mocked(paymentCommands.createMolliePayment).mockResolvedValue({
        success: true,
        paymentUrl: 'https://checkout.mollie.com/payment/tr_12345',
        paymentId: 'tr_12345',
      });

      // Execute: Process checkout
      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set(
        'cartItems',
        JSON.stringify([{ id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' }]),
      );
      formData.set('email', 'test@example.com');
      formData.set('name', 'Test User');

      const result = await processCheckout({}, formData);

      // Assert: Should return payment URL
      expect(result.success).toBe(true);
      expect(result.paymentUrl).toBe('https://checkout.mollie.com/payment/tr_12345');
      expect(result.redirectUrl).toBeUndefined();

      // Assert: Order was created
      expect(orderCommands.createOrder).toHaveBeenCalledWith({
        userId: null,
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        totalAmount: '35.00',
        status: 'pending',
      });

      // Assert: Line items were created
      expect(ticketSalesCommands.createLineItems).toHaveBeenCalledWith([
        {
          performanceId: 'perf-1',
          userId: null,
          quantity: 1,
          orderId: 'order-123',
          pricePerTicket: '35.00',
        },
      ]);

      // Assert: Seats were reserved (SELECT FOR UPDATE + UPDATE)
      expect(mockTransactionExecute).toHaveBeenCalledTimes(2);

      // Assert: Payment was created with Mollie
      expect(paymentCommands.createMolliePayment).toHaveBeenCalledWith({
        orderId: 'order-123',
        amount: '35.00',
        currency: 'EUR',
        description: expect.stringContaining('Bestelling'),
        redirectUrl: 'http://localhost:3000/checkout/success?orderId=order-123',
        webhookUrl: 'http://localhost:3000/api/webhooks/mollie',
        metadata: {
          orderId: 'order-123',
          customerEmail: 'test@example.com',
        },
      });

      // Assert: NO job was queued (payment succeeded immediately)
      expect(jobProcessor.createJob).not.toHaveBeenCalled();

      // Assert: NO queued payment email was sent
      expect(emailUtils.sendQueuedPaymentEmail).not.toHaveBeenCalled();
    });
  });

  describe('Retry Path - Payment provider unavailable', () => {
    it('should create order, reserve seats, queue job, send email, and redirect to order page', async () => {
      // Setup: Mock performance data
      mockPerformancesFindMany.mockResolvedValue([
        {
          id: 'perf-1',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'published',
          availableSeats: 100,
        },
      ]);

      // Setup: Mock order creation
      const mockOrder = {
        id: 'order-123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        totalAmount: '35.00',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
      };
      vi.mocked(orderCommands.createOrder).mockResolvedValue(mockOrder as any);

      // Setup: Mock line items creation
      vi.mocked(ticketSalesCommands.createLineItems).mockResolvedValue([]);

      // Setup: Mock SELECT ... FOR UPDATE (locked performances)
      mockTransactionExecute.mockResolvedValueOnce({
        rows: [{ id: 'perf-1', available_seats: 100 }],
      });

      // Setup: Mock seat update
      mockTransactionExecute.mockResolvedValueOnce(undefined);

      // Setup: Mock payment provider failure
      vi.mocked(paymentCommands.createMolliePayment).mockResolvedValue({
        success: false,
        error: 'Mollie API timeout',
      });

      // Setup: Mock job creation
      vi.mocked(jobProcessor.createJob).mockResolvedValue('job-123');

      // Setup: Mock email sending
      vi.mocked(emailUtils.sendQueuedPaymentEmail).mockResolvedValue(undefined);

      // Execute: Process checkout
      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set(
        'cartItems',
        JSON.stringify([{ id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' }]),
      );
      formData.set('email', 'test@example.com');
      formData.set('name', 'Test User');

      const result = await processCheckout({}, formData);

      // Assert: Should redirect to order page (not payment URL)
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toContain('/order/order-123');
      expect(result.redirectUrl).toContain('email=test');
      expect(result.paymentUrl).toBeUndefined();

      // Assert: Order was created and seats were reserved (same as happy path)
      expect(orderCommands.createOrder).toHaveBeenCalled();
      expect(ticketSalesCommands.createLineItems).toHaveBeenCalled();
      expect(mockTransactionExecute).toHaveBeenCalledTimes(2);

      // Assert: Payment job was queued
      expect(jobProcessor.createJob).toHaveBeenCalledWith('payment_creation', {
        orderId: 'order-123',
        amount: 35,
        currency: 'EUR',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        description: expect.stringContaining('Bestelling'),
        redirectUrl: 'http://localhost:3000/checkout/success?orderId=order-123',
        webhookUrl: 'http://localhost:3000/api/webhooks/mollie',
      });

      // Assert: Queued payment email was sent
      expect(emailUtils.sendQueuedPaymentEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        customerName: 'Test User',
        orderId: 'order-123',
        orderNumber: expect.any(String),
        totalAmount: '35.00',
      });
    });

    it.skip('should continue checkout even if queued payment email fails', async () => {
      // Setup: Same as previous test but email fails
      mockPerformancesFindMany.mockResolvedValue([
        {
          id: 'perf-1',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'published',
          availableSeats: 100,
        },
      ]);

      const mockOrder = {
        id: 'order-123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        totalAmount: '35.00',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
      };
      vi.mocked(orderCommands.createOrder).mockResolvedValue(mockOrder as any);
      vi.mocked(ticketSalesCommands.createLineItems).mockResolvedValue([]);

      // Setup transaction mocks - SELECT FOR UPDATE then UPDATE seats
      mockTransactionExecute
        .mockResolvedValueOnce({ rows: [{ id: 'perf-1', available_seats: 100 }] })
        .mockResolvedValueOnce(undefined);

      vi.mocked(paymentCommands.createMolliePayment).mockResolvedValue({
        success: false,
        error: 'Mollie API timeout',
      });

      vi.mocked(jobProcessor.createJob).mockResolvedValue('job-123');

      // Email fails but shouldn't crash checkout
      vi.mocked(emailUtils.sendQueuedPaymentEmail).mockRejectedValue(new Error('SMTP timeout'));

      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set(
        'cartItems',
        JSON.stringify([{ id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' }]),
      );
      formData.set('email', 'test@example.com');
      formData.set('name', 'Test User');

      const result = await processCheckout({}, formData);

      // Assert: Checkout still succeeds despite email failure
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toContain('/order/order-123');
      expect(jobProcessor.createJob).toHaveBeenCalled();
    });
  });

  describe('Newsletter Subscription', () => {
    it('should subscribe to newsletter when checkbox is checked', async () => {
      // Setup mocks
      mockPerformancesFindMany.mockResolvedValue([
        {
          id: 'perf-1',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'published',
          availableSeats: 100,
        },
      ]);
      vi.mocked(orderCommands.createOrder).mockResolvedValue({
        id: 'order-123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        totalAmount: '35.00',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
      } as any);
      vi.mocked(ticketSalesCommands.createLineItems).mockResolvedValue([]);
      mockTransactionExecute.mockResolvedValueOnce({
        rows: [{ id: 'perf-1', available_seats: 100 }],
      });
      mockTransactionExecute.mockResolvedValueOnce(undefined);
      vi.mocked(paymentCommands.createMolliePayment).mockResolvedValue({
        success: true,
        paymentUrl: 'https://checkout.mollie.com/payment/tr_12345',
      });
      vi.mocked(mailingListCommands.subscribeToMailingList).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set(
        'cartItems',
        JSON.stringify([{ id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' }]),
      );
      formData.set('email', 'test@example.com');
      formData.set('name', 'Test User');
      formData.set('subscribeNewsletter', 'on');

      await processCheckout({}, formData);

      // Assert: Newsletter subscription was attempted
      expect(mailingListCommands.subscribeToMailingList).toHaveBeenCalledWith(
        'test@example.com',
        'Test User',
      );
    });

    it('should not fail checkout if newsletter subscription fails', async () => {
      // Setup mocks
      mockPerformancesFindMany.mockResolvedValue([
        {
          id: 'perf-1',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'published',
          availableSeats: 100,
        },
      ]);
      vi.mocked(orderCommands.createOrder).mockResolvedValue({
        id: 'order-123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        totalAmount: '35.00',
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: null,
      } as any);
      vi.mocked(ticketSalesCommands.createLineItems).mockResolvedValue([]);
      mockTransactionExecute.mockResolvedValueOnce({
        rows: [{ id: 'perf-1', available_seats: 100 }],
      });
      mockTransactionExecute.mockResolvedValueOnce(undefined);
      vi.mocked(paymentCommands.createMolliePayment).mockResolvedValue({
        success: true,
        paymentUrl: 'https://checkout.mollie.com/payment/tr_12345',
      });
      vi.mocked(mailingListCommands.subscribeToMailingList).mockRejectedValue(
        new Error('Mailchimp API error'),
      );

      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set(
        'cartItems',
        JSON.stringify([{ id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' }]),
      );
      formData.set('email', 'test@example.com');
      formData.set('name', 'Test User');
      formData.set('subscribeNewsletter', 'on');

      const result = await processCheckout({}, formData);

      // Assert: Checkout succeeds despite newsletter failure
      expect(result.success).toBe(true);
      expect(result.paymentUrl).toBeTruthy();
    });
  });

  describe('Validation', () => {
    it('should reject empty cart', async () => {
      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set('cartItems', '[]');
      formData.set('email', 'test@example.com');
      formData.set('name', 'Test User');

      const result = await processCheckout({}, formData);

      expect(result.error).toContain('winkelwagen is leeg');
    });

    it('should reject invalid email', async () => {
      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set(
        'cartItems',
        JSON.stringify([{ id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' }]),
      );
      formData.set('email', 'invalid-email');
      formData.set('name', 'Test User');

      const result = await processCheckout({}, formData);

      expect(result.error).toBeTruthy();
      expect(orderCommands.createOrder).not.toHaveBeenCalled();
    });

    it('should reject missing name', async () => {
      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set(
        'cartItems',
        JSON.stringify([{ id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' }]),
      );
      formData.set('email', 'test@example.com');
      formData.set('name', '');

      const result = await processCheckout({}, formData);

      expect(result.error).toContain('Naam is verplicht');
      expect(orderCommands.createOrder).not.toHaveBeenCalled();
    });

    it('should reject performances with past dates', async () => {
      // Setup: Mock performance with past date
      mockPerformancesFindMany.mockResolvedValue([
        {
          id: 'perf-1',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          status: 'published',
          availableSeats: 100,
        },
      ]);

      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set(
        'cartItems',
        JSON.stringify([{ id: 'perf-1', quantity: 1, price: 35, title: 'Past Show' }]),
      );
      formData.set('email', 'test@example.com');
      formData.set('name', 'Test User');

      const result = await processCheckout({}, formData);

      expect(result.error).toContain('niet meer beschikbaar');
      expect(orderCommands.createOrder).not.toHaveBeenCalled();
    });

    it('should reject performances that are not published', async () => {
      // Setup: Mock performance with unpublished status
      mockPerformancesFindMany.mockResolvedValue([
        {
          id: 'perf-1',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'draft',
          availableSeats: 100,
        },
      ]);

      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set(
        'cartItems',
        JSON.stringify([{ id: 'perf-1', quantity: 1, price: 35, title: 'Unpublished Show' }]),
      );
      formData.set('email', 'test@example.com');
      formData.set('name', 'Test User');

      const result = await processCheckout({}, formData);

      expect(result.error).toContain('niet meer beschikbaar');
      expect(orderCommands.createOrder).not.toHaveBeenCalled();
    });

    it('should reject performances with no available seats', async () => {
      // Setup: Mock performance with zero available seats
      mockPerformancesFindMany.mockResolvedValue([
        {
          id: 'perf-1',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'published',
          availableSeats: 0,
        },
      ]);

      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set(
        'cartItems',
        JSON.stringify([{ id: 'perf-1', quantity: 1, price: 35, title: 'Sold Out Show' }]),
      );
      formData.set('email', 'test@example.com');
      formData.set('name', 'Test User');

      const result = await processCheckout({}, formData);

      expect(result.error).toContain('niet meer beschikbaar');
      expect(orderCommands.createOrder).not.toHaveBeenCalled();
    });
  });
});
