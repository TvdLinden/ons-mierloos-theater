'use server';

import { subscribeToMailingList } from '@/lib/commands/mailingList';
import { createLineItems } from '@/lib/commands/ticketSales';
import { createOrder } from '@/lib/commands/orders';
import { createMolliePayment } from '@/lib/commands/payments';
import { getUserByEmail } from '@/lib/queries/users';
import { validateCoupon } from '@/lib/utils/couponValidation';
import { validateCartItems, isPerformanceAvailable } from '@/lib/utils/validation';
import { validateEmail } from '@/lib/utils/emailValidation';
import {
  validateSeatsAvailable,
  updateAvailableSeats,
  releaseSeats,
} from '@/lib/queries/performances';
import { createJob } from '@/lib/jobs/jobProcessor';
import { sendQueuedPaymentEmail } from '@/lib/utils/email';
import { db } from '@/lib/db';
import {
  couponUsages,
  coupons,
  performances,
  orders as ordersTable,
  lineItems as lineItemsTable,
} from '@/lib/db/schema';
import { inArray, sql, eq } from 'drizzle-orm';
import type { CartItem } from '@/components/ShoppingCart';

export type CheckoutState = {
  error?: string;
  success?: boolean;
  paymentUrl?: string;
  redirectUrl?: string;
  couponApplied?: boolean;
  couponCode?: string;
  discountAmount?: number;
  couponError?: string;
};

export async function processCheckout(
  prevState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  try {
    const action = formData.get('action') as string;
    const cartItemsJson = formData.get('cartItems') as string;

    // Parse cart items
    let cartItems: CartItem[] = [];
    try {
      cartItems = JSON.parse(cartItemsJson);
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return { error: 'Je winkelwagen is leeg.' };
      }
    } catch (error) {
      return { error: 'Ongeldige winkelwagen data.' };
    }

    // Handle coupon application
    if (action === 'apply-coupon') {
      const couponCode = formData.get('couponCode') as string;
      if (!couponCode) {
        return { ...prevState, couponError: 'Voer een couponcode in' };
      }

      // Find user if email is provided
      const rawEmail = formData.get('email') as string;
      let userId: string | null = null;
      if (rawEmail) {
        try {
          const emailValidation = validateEmail(rawEmail);
          if (emailValidation.isValid) {
            const user = await getUserByEmail(emailValidation.normalized);
            if (user) {
              userId = user.id;
            }
          }
        } catch (error) {
          // Continue without user ID
        }
      }

      const validation = await validateCoupon(couponCode, cartItems, userId);
      if (!validation.valid) {
        return { ...prevState, couponError: validation.error };
      }

      return {
        ...prevState,
        couponApplied: true,
        couponCode: couponCode,
        discountAmount: validation.discountAmount,
        couponError: undefined,
      };
    }

    // Handle coupon removal
    if (action === 'remove-coupon') {
      return {
        ...prevState,
        couponApplied: false,
        couponCode: undefined,
        discountAmount: 0,
        couponError: undefined,
      };
    }

    // Process checkout
    const rawEmail = formData.get('email') as string;
    const name = formData.get('name') as string;
    const subscribeNewsletter = formData.get('subscribeNewsletter') === 'on';
    const appliedCoupon = formData.get('appliedCoupon') as string;

    // Validate name
    if (!name || !name.trim()) {
      return { error: 'Naam is verplicht.' };
    }

    // Validate and normalize email
    const emailValidation = validateEmail(rawEmail || '');
    if (!emailValidation.isValid) {
      return { error: emailValidation.error };
    }

    const email = emailValidation.normalized;

    // Validate that all cart items are still available
    const performanceIds = [...new Set(cartItems.map((item) => item.id))];
    const perfData = await db.query.performances.findMany({
      where: inArray(performances.id, performanceIds),
      columns: {
        id: true,
        date: true,
        status: true,
        availableSeats: true,
      },
    });

    const {
      valid: validItems,
      invalid: invalidItems,
      invalidReasons,
    } = validateCartItems(cartItems, perfData);

    if (invalidItems.length > 0) {
      const reasons = invalidItems
        .map((item) => `${item.title}: ${invalidReasons[item.id]}`)
        .join(', ');
      return {
        error: `Sommige items in je winkelwagen zijn niet meer beschikbaar. ${reasons}`,
      };
    }

    // Use only valid items for checkout
    const itemsToCheckout = validItems.length > 0 ? validItems : cartItems;

    // Group items by performance
    const performanceGroups = new Map<string, number>();
    for (const item of itemsToCheckout) {
      const current = performanceGroups.get(item.id) || 0;
      performanceGroups.set(item.id, current + item.quantity);
    }

    // Re-validate seat availability before proceeding
    let total = itemsToCheckout.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    let discountType: 'percentage' | 'fixed' | 'free_tickets' | null = null;
    let couponId: string | null = null;

    // Apply coupon if provided
    if (appliedCoupon) {
      const validation = await validateCoupon(appliedCoupon, itemsToCheckout, null);
      if (validation.valid && validation.coupon) {
        discountAmount = validation.discountAmount || 0;
        couponId = validation.coupon.id;
        discountType = validation.coupon.discountType;
        total -= discountAmount;
      }
    }

    console.log('Processing order:', {
      email,
      name,
      itemsToCheckout,
      total,
      discountAmount,
      couponId,
    });

    // Find user by email if they have an account
    let userId: string | null = null;
    try {
      const user = await getUserByEmail(email);
      if (user) {
        userId = user.id;
      }
    } catch (error) {
      console.log('User lookup failed, continuing as guest:', error);
    }

    // Subscribe to mailing list if checkbox is checked
    if (subscribeNewsletter) {
      try {
        await subscribeToMailingList(email, name);
      } catch (error) {
        console.error('Failed to subscribe to mailing list:', error);
        // Don't fail checkout if newsletter subscription fails
      }
    }

    // Create order
    let order;
    try {
      // Create order with row-level locking to prevent race conditions
      order = await db.transaction(async (tx) => {
        // Create the order first
        const createdOrder = await createOrder({
          userId,
          customerName: name,
          customerEmail: email,
          totalAmount: total.toFixed(2),
          status: 'pending',
        });

        // Create line items before locking performances
        // This avoids FK lock conflicts since constraint verification happens before the lock
        await createLineItems(
          itemsToCheckout.map((item) => ({
            performanceId: item.id,
            userId: userId,
            quantity: item.quantity,
            orderId: createdOrder.id,
            pricePerTicket: item.price.toFixed(2),
            wheelchairAccess: item.wheelchairAccess || false,
          })),
        );

        // NOW fetch and lock performances using SELECT ... FOR UPDATE
        // This prevents other transactions from modifying these rows until we commit
        const perfIds = Array.from(performanceGroups.keys());
        const lockedPerformances = await tx.execute<{
          id: string;
          available_seats: number;
        }>(
          sql`
            SELECT id, available_seats
            FROM ${performances}
            WHERE id IN (${sql.join(
              perfIds.map((id) => sql`${id}`),
              sql`, `,
            )})
            ORDER BY id
            FOR UPDATE
          `,
        );

        console.log(`[LOCK] Locked ${lockedPerformances.rows.length} performances for checkout`);

        // Build map of locked performance data
        const lockedPerfMap = new Map<string, number>();
        for (const row of lockedPerformances.rows) {
          lockedPerfMap.set(row.id, row.available_seats);
        }

        // Validate seat availability within the lock (no race condition possible)
        for (const [perfId, quantity] of performanceGroups.entries()) {
          const available = lockedPerfMap.get(perfId);
          if (available === undefined || available < quantity) {
            throw new Error(
              `Niet genoeg kaarten beschikbaar voor voorstelling ${perfId}. Probeer het opnieuw.`,
            );
          }
        }

        // Reserve seats in performances (decrement available_seats)
        // Rows are still locked from the SELECT ... FOR UPDATE above
        for (const [perfId, quantity] of performanceGroups.entries()) {
          await tx.execute(
            sql`
              UPDATE ${performances}
              SET available_seats = available_seats - ${quantity}
              WHERE id = ${perfId}
              AND available_seats >= ${quantity}
            `,
          );
        }

        // Record coupon usage if coupon was applied (within transaction for atomicity)
        if (couponId && discountType) {
          await tx.insert(couponUsages).values({
            couponId,
            orderId: createdOrder.id,
            userId: userId || null,
            discountType,
            discountAmount: discountAmount.toFixed(2),
          });

          // Increment coupon usage count
          await tx.execute(sql`
            UPDATE ${coupons}
            SET usage_count = usage_count + 1,
                updated_at = NOW()
            WHERE id = ${couponId}
          `);
        }

        console.log(
          `✅ Order ${createdOrder.id} created and ${performanceGroups.size} performances updated with seat reservations, coupon recorded`,
        );

        return createdOrder;
      });
    } catch (error) {
      console.error('Failed to create order and reserve seats:', error);
      return { error: 'Kon bestelling niet aanmaken. Probeer het opnieuw.' };
    }

    // Create Mollie payment
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    try {
      const paymentResult = await createMolliePayment({
        orderId: order.id,
        amount: total.toFixed(2),
        currency: 'EUR',
        description: `Bestelling ${order.id.substring(0, 8)} - ${itemsToCheckout.length} item(s)`,
        redirectUrl: `${baseUrl}/checkout/success?orderId=${order.id}`,
        webhookUrl: `${baseUrl}/api/webhooks/mollie`,
        metadata: {
          orderId: order.id,
          customerEmail: email,
        },
      });

      if (!paymentResult.success || !paymentResult.paymentUrl) {
        // Payment creation failed - queue for retry
        console.warn(
          `[PAYMENT_FAILURE] Mollie payment creation failed for order ${order.id}, queueing job for retry`,
        );

        await createJob('payment_creation', {
          orderId: order.id,
          amount: parseFloat(total.toFixed(2)),
          currency: 'EUR',
          customerEmail: email,
          customerName: name,
          description: `Bestelling ${order.id.substring(0, 8)} - ${itemsToCheckout.length} item(s)`,
          redirectUrl: `${baseUrl}/checkout/success?orderId=${order.id}`,
          webhookUrl: `${baseUrl}/api/webhooks/mollie`,
        });

        // Send email with clear instructions
        await sendQueuedPaymentEmail({
          to: email,
          orderNumber: order.id.substring(0, 8),
          customerName: name,
          totalAmount: total.toFixed(2),
          orderId: order.id,
        });

        // Redirect to order status page
        return {
          success: true,
          redirectUrl: `/order/${order.id}?email=${encodeURIComponent(email)}`,
        };
      }

      // Return payment URL to redirect user
      return {
        success: true,
        paymentUrl: paymentResult.paymentUrl,
      };
    } catch (error) {
      // Unexpected error during payment creation - queue for retry
      console.error(
        `[PAYMENT_ERROR] Unexpected error creating payment for order ${order.id}:`,
        error,
      );

      await createJob('payment_creation', {
        orderId: order.id,
        amount: parseFloat(total.toFixed(2)),
        currency: 'EUR',
        customerEmail: email,
        customerName: name,
        description: `Bestelling ${order.id.substring(0, 8)} - ${itemsToCheckout.length} item(s)`,
        redirectUrl: `${baseUrl}/checkout/success?orderId=${order.id}`,
        webhookUrl: `${baseUrl}/api/webhooks/mollie`,
      });

      // Send email with clear instructions
      await sendQueuedPaymentEmail({
        to: email,
        orderNumber: order.id.substring(0, 8),
        customerName: name,
        totalAmount: total.toFixed(2),
        orderId: order.id,
      });

      // Redirect to order status page
      return {
        success: true,
        redirectUrl: `/order/${order.id}?email=${encodeURIComponent(email)}`,
      };
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return { error: 'Er is iets misgegaan. Probeer het opnieuw.' };
  }
}
