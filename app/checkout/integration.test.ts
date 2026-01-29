/**
 * Integration tests for processCheckout
 *
 * Tests the complete checkout flow:
 * - Happy path: Order creation + immediate payment success
 * - Retry path: Order creation + payment provider failure + job queuing
 */

import { processCheckout } from './actions';
import * as paymentCommands from '@/lib/commands/payments';
import * as jobProcessor from '@/lib/jobs/jobProcessor';
import * as emailUtils from '@/lib/utils/email';
import * as orderCommands from '@/lib/commands/orders';
import * as ticketSalesCommands from '@/lib/commands/ticketSales';
import * as mailingListCommands from '@/lib/commands/mailingList';

// Mock all external dependencies
jest.mock('@/lib/commands/payments');
jest.mock('@/lib/jobs/jobProcessor');
jest.mock('@/lib/utils/email');
jest.mock('@/lib/commands/orders');
jest.mock('@/lib/commands/ticketSales');
jest.mock('@/lib/commands/mailingList');
jest.mock('@/lib/queries/users', () => ({
  getUserByEmail: jest.fn().mockResolvedValue(null),
}));
jest.mock('@/lib/utils/couponValidation', () => ({
  validateCoupon: jest.fn().mockResolvedValue({ valid: false }),
}));

// Mock database
jest.mock('@/lib/db', () => {
  const mockPerformancesFindMany = jest.fn();
  const mockTransactionExecute = jest.fn();
  const mockTransactionInsert = jest.fn().mockReturnValue({ values: jest.fn() });

  const mockTx = {
    execute: mockTransactionExecute,
    insert: mockTransactionInsert,
    query: {
      performances: {
        findMany: jest.fn(),
      },
    },
  };

  const mockTransaction = jest.fn((callback) => callback(mockTx));

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
const dbModule = require('@/lib/db');
const db = dbModule.db;
const mockTx = dbModule.mockTx;
const mockPerformancesFindMany = dbModule.mockPerformancesFindMany;
const mockTransactionExecute = dbModule.mockTransactionExecute;
const mockTransactionInsert = dbModule.mockTransactionInsert;

describe('processCheckout Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformancesFindMany.mockReset();
    mockTransactionExecute.mockReset();
    mockTransactionInsert.mockReset().mockReturnValue({ values: jest.fn() });
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
        status: 'pending',
      };
      (orderCommands.createOrder as jest.Mock).mockResolvedValue(mockOrder);

      // Setup: Mock line items creation
      (ticketSalesCommands.createLineItems as jest.Mock).mockResolvedValue([]);

      // Setup: Mock SELECT ... FOR UPDATE (locked performances)
      mockTransactionExecute.mockResolvedValueOnce({
        rows: [{ id: 'perf-1', available_seats: 100 }],
      });

      // Setup: Mock seat update
      mockTransactionExecute.mockResolvedValueOnce(undefined);

      // Setup: Mock successful payment creation
      (paymentCommands.createMolliePayment as jest.Mock).mockResolvedValue({
        success: true,
        paymentUrl: 'https://checkout.mollie.com/payment/tr_12345',
        paymentId: 'tr_12345',
      });

      // Execute: Process checkout
      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set('cartItems', JSON.stringify([
        { id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' },
      ]));
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
        status: 'pending',
      };
      (orderCommands.createOrder as jest.Mock).mockResolvedValue(mockOrder);

      // Setup: Mock line items creation
      (ticketSalesCommands.createLineItems as jest.Mock).mockResolvedValue([]);

      // Setup: Mock SELECT ... FOR UPDATE (locked performances)
      mockTransactionExecute.mockResolvedValueOnce({
        rows: [{ id: 'perf-1', available_seats: 100 }],
      });

      // Setup: Mock seat update
      mockTransactionExecute.mockResolvedValueOnce(undefined);

      // Setup: Mock payment provider failure
      (paymentCommands.createMolliePayment as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Mollie API timeout',
      });

      // Setup: Mock job creation
      (jobProcessor.createJob as jest.Mock).mockResolvedValue('job-123');

      // Setup: Mock email sending
      (emailUtils.sendQueuedPaymentEmail as jest.Mock).mockResolvedValue(undefined);

      // Execute: Process checkout
      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set('cartItems', JSON.stringify([
        { id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' },
      ]));
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
        status: 'pending',
      };
      (orderCommands.createOrder as jest.Mock).mockResolvedValue(mockOrder);
      (ticketSalesCommands.createLineItems as jest.Mock).mockResolvedValue([]);

      // Setup transaction mocks - SELECT FOR UPDATE then UPDATE seats
      mockTransactionExecute
        .mockResolvedValueOnce({ rows: [{ id: 'perf-1', available_seats: 100 }] })
        .mockResolvedValueOnce(undefined);

      (paymentCommands.createMolliePayment as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Mollie API timeout',
      });

      (jobProcessor.createJob as jest.Mock).mockResolvedValue('job-123');

      // Email fails but shouldn't crash checkout
      (emailUtils.sendQueuedPaymentEmail as jest.Mock).mockRejectedValue(
        new Error('SMTP timeout')
      );

      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set('cartItems', JSON.stringify([
        { id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' },
      ]));
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
        { id: 'perf-1', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: 'published', availableSeats: 100 },
      ]);
      (orderCommands.createOrder as jest.Mock).mockResolvedValue({
        id: 'order-123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        totalAmount: '35.00',
        status: 'pending',
      });
      (ticketSalesCommands.createLineItems as jest.Mock).mockResolvedValue([]);
      mockTransactionExecute.mockResolvedValueOnce({ rows: [{ id: 'perf-1', available_seats: 100 }] });
      mockTransactionExecute.mockResolvedValueOnce(undefined);
      (paymentCommands.createMolliePayment as jest.Mock).mockResolvedValue({
        success: true,
        paymentUrl: 'https://checkout.mollie.com/payment/tr_12345',
      });
      (mailingListCommands.subscribeToMailingList as jest.Mock).mockResolvedValue(undefined);

      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set('cartItems', JSON.stringify([
        { id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' },
      ]));
      formData.set('email', 'test@example.com');
      formData.set('name', 'Test User');
      formData.set('subscribeNewsletter', 'on');

      await processCheckout({}, formData);

      // Assert: Newsletter subscription was attempted
      expect(mailingListCommands.subscribeToMailingList).toHaveBeenCalledWith(
        'test@example.com',
        'Test User'
      );
    });

    it('should not fail checkout if newsletter subscription fails', async () => {
      // Setup mocks
      mockPerformancesFindMany.mockResolvedValue([
        { id: 'perf-1', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: 'published', availableSeats: 100 },
      ]);
      (orderCommands.createOrder as jest.Mock).mockResolvedValue({
        id: 'order-123',
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        totalAmount: '35.00',
        status: 'pending',
      });
      (ticketSalesCommands.createLineItems as jest.Mock).mockResolvedValue([]);
      mockTransactionExecute.mockResolvedValueOnce({ rows: [{ id: 'perf-1', available_seats: 100 }] });
      mockTransactionExecute.mockResolvedValueOnce(undefined);
      (paymentCommands.createMolliePayment as jest.Mock).mockResolvedValue({
        success: true,
        paymentUrl: 'https://checkout.mollie.com/payment/tr_12345',
      });
      (mailingListCommands.subscribeToMailingList as jest.Mock).mockRejectedValue(
        new Error('Mailchimp API error')
      );

      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set('cartItems', JSON.stringify([
        { id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' },
      ]));
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
      formData.set('cartItems', JSON.stringify([
        { id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' },
      ]));
      formData.set('email', 'invalid-email');
      formData.set('name', 'Test User');

      const result = await processCheckout({}, formData);

      expect(result.error).toBeTruthy();
      expect(orderCommands.createOrder).not.toHaveBeenCalled();
    });

    it('should reject missing name', async () => {
      const formData = new FormData();
      formData.set('action', 'checkout');
      formData.set('cartItems', JSON.stringify([
        { id: 'perf-1', quantity: 1, price: 35, title: 'Test Show' },
      ]));
      formData.set('email', 'test@example.com');
      formData.set('name', '');

      const result = await processCheckout({}, formData);

      expect(result.error).toContain('Naam is verplicht');
      expect(orderCommands.createOrder).not.toHaveBeenCalled();
    });
  });
});
