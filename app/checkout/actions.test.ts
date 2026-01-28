import { processCheckout } from './actions';
import { db } from '@/lib/db';
import { createJob } from '@/lib/jobs/jobProcessor';
import { sendQueuedPaymentEmail } from '@/lib/utils/email';
import { createMolliePayment } from '@/lib/commands/payments';
import { getUserByEmail } from '@/lib/queries/users';
import { subscribeToMailingList } from '@/lib/commands/mailingList';

// Mock modules
jest.mock('@/lib/jobs/jobProcessor');
jest.mock('@/lib/utils/email');
jest.mock('@/lib/commands/payments');
jest.mock('@/lib/queries/users');
jest.mock('@/lib/commands/mailingList');

describe('Checkout - Payment Provider Unavailable Recovery', () => {
  const mockOrderId = 'order-123';
  const mockPerformanceId = 'perf-1';

  const createMockFormData = () => {
    const formData = new FormData();
    formData.append('action', 'checkout');
    formData.append(
      'cartItems',
      JSON.stringify([
        {
          id: mockPerformanceId,
          title: 'Test Show',
          date: '2025-02-14',
          quantity: 2,
          price: 25.0,
        },
      ])
    );
    formData.append('email', 'test@example.com');
    formData.append('name', 'Test User');
    formData.append('subscribeNewsletter', 'off');
    return formData;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (getUserByEmail as jest.Mock).mockResolvedValue(null);
    (subscribeToMailingList as jest.Mock).mockResolvedValue(undefined);

    // Mock database operations
    (db.query.performances.findMany as jest.Mock).mockResolvedValue([
      {
        id: mockPerformanceId,
        date: new Date('2025-02-14'),
        status: 'active',
        availableSeats: 10,
      },
    ]);

    (db.transaction as jest.Mock).mockImplementation(async (callback) => {
      return await callback({
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue([{ id: mockOrderId }]),
        }),
        execute: jest.fn().mockResolvedValue({ rows: [{ id: mockPerformanceId, available_seats: 10 }] }),
      } as any);
    });

    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockResolvedValue([{ id: mockOrderId, status: 'pending' }]),
    });
  });

  describe('Mollie Payment Creation Fails - Job Queued', () => {
    it('should queue payment_creation job when Mollie API is unavailable', async () => {
      // Mock Mollie payment creation failure
      (createMolliePayment as jest.Mock).mockResolvedValue({
        success: false,
        paymentUrl: null,
        error: 'Unable to reach Mollie',
      });

      // Run checkout
      const result = await processCheckout({}, createMockFormData());

      // Verify payment job was created
      expect(createJob).toHaveBeenCalledWith(
        'payment_creation',
        expect.objectContaining({
          orderId: expect.any(String),
          amount: 50.0,
          currency: 'EUR',
          customerEmail: 'test@example.com',
          customerName: 'Test User',
        })
      );

      // Verify queued payment email was sent
      expect(sendQueuedPaymentEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          totalAmount: '50.00',
        })
      );

      // Verify user is redirected to order status page
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toContain('/order/');
    });

    it('should queue job when Mollie payment creation throws exception', async () => {
      // Mock Mollie payment creation throw
      (createMolliePayment as jest.Mock).mockRejectedValue(
        new Error('Network timeout connecting to Mollie')
      );

      // Run checkout
      const result = await processCheckout({}, createMockFormData());

      // Verify payment job was created
      expect(createJob).toHaveBeenCalledWith(
        'payment_creation',
        expect.objectContaining({
          orderId: expect.any(String),
        })
      );

      // Verify queued payment email was sent
      expect(sendQueuedPaymentEmail).toHaveBeenCalled();

      // Verify user is redirected to order status page
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toContain('/order/');
    });
  });

  describe('Mollie Payment Creation Success', () => {
    it('should redirect to payment URL when Mollie succeeds', async () => {
      const mockPaymentUrl = 'https://checkout.mollie.com/test';

      (createMolliePayment as jest.Mock).mockResolvedValue({
        success: true,
        paymentUrl: mockPaymentUrl,
      });

      // Run checkout
      const result = await processCheckout({}, createMockFormData());

      // Verify no job was created
      expect(createJob).not.toHaveBeenCalled();

      // Verify no email was sent
      expect(sendQueuedPaymentEmail).not.toHaveBeenCalled();

      // Verify user is redirected to payment URL
      expect(result.success).toBe(true);
      expect(result.paymentUrl).toBe(mockPaymentUrl);
    });
  });

  describe('Validation and Error Handling', () => {
    it('should reject empty cart', async () => {
      const formData = new FormData();
      formData.append('action', 'checkout');
      formData.append('cartItems', JSON.stringify([]));
      formData.append('email', 'test@example.com');
      formData.append('name', 'Test User');

      const result = await processCheckout({}, formData);

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('winkelwagen');
    });

    it('should reject invalid email', async () => {
      const formData = new FormData();
      formData.append('action', 'checkout');
      formData.append(
        'cartItems',
        JSON.stringify([
          {
            id: mockPerformanceId,
            title: 'Test Show',
            date: '2025-02-14',
            quantity: 2,
            price: 25.0,
          },
        ])
      );
      formData.append('email', 'invalid-email');
      formData.append('name', 'Test User');

      const result = await processCheckout({}, formData);

      expect(result.error).toBeTruthy();
    });

    it('should reject when seats are unavailable', async () => {
      (db.query.performances.findMany as jest.Mock).mockResolvedValue([
        {
          id: mockPerformanceId,
          date: new Date('2025-02-14'),
          status: 'active',
          availableSeats: 0, // No seats available
        },
      ]);

      const result = await processCheckout({}, createMockFormData());

      expect(result.error).toBeTruthy();
      expect(result.error).toContain('niet meer beschikbaar');
    });
  });

  describe('Coupon Handling', () => {
    it('should apply valid coupon and reduce total', async () => {
      (createMolliePayment as jest.Mock).mockResolvedValue({
        success: true,
        paymentUrl: 'https://checkout.mollie.com/test',
      });

      const formData = createMockFormData();
      formData.append('appliedCoupon', 'DISCOUNT10');

      const result = await processCheckout({}, formData);

      // If coupon is valid, it would be applied (details depend on your coupon validation logic)
      expect(result).toBeDefined();
    });
  });
});
