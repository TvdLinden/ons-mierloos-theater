'use server';

import { subscribeToMailingList } from '@/lib/commands/mailingList';
import { createLineItems } from '@/lib/commands/ticketSales';
import { createOrder } from '@/lib/commands/orders';
import { createMolliePayment } from '@/lib/commands/payments';
import { getUserByEmail } from '@/lib/queries/users';
import { validateCoupon } from '@/lib/utils/couponValidation';
import { db } from '@/lib/db';
import { couponUsages } from '@/lib/db/schema';
import type { CartItem } from '@/components/ShoppingCart';

export type CheckoutState = {
  error?: string;
  success?: boolean;
  paymentUrl?: string;
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
      const email = formData.get('email') as string;
      let userId: string | null = null;
      if (email) {
        try {
          const user = await getUserByEmail(email);
          if (user) {
            userId = user.id;
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
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const subscribeNewsletter = formData.get('subscribeNewsletter') === 'on';
    const appliedCoupon = formData.get('appliedCoupon') as string;

    if (!email || !name) {
      return { error: 'Naam en e-mailadres zijn verplicht.' };
    }

    // Calculate total
    let total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    let couponId: string | null = null;

    // Apply coupon if provided
    if (appliedCoupon) {
      const validation = await validateCoupon(appliedCoupon, cartItems, null);
      if (validation.valid && validation.coupon) {
        discountAmount = validation.discountAmount || 0;
        couponId = validation.coupon.id;
        total -= discountAmount;
      }
    }

    console.log('Processing order:', { email, name, cartItems, total, discountAmount, couponId });

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
      order = await createOrder({
        userId,
        customerName: name,
        customerEmail: email,
        totalAmount: total.toFixed(2),
        status: 'pending',
      });
    } catch (error) {
      console.error('Failed to create order:', error);
      return { error: 'Kon bestelling niet aanmaken. Probeer het opnieuw.' };
    }

    // Create line items linked to the order
    try {
      await createLineItems(
        cartItems.map((item) => ({
          performanceId: item.id,
          userId: userId,
          quantity: item.quantity,
          orderId: order.id,
          pricePerTicket: item.price.toFixed(2),
        })),
      );
    } catch (error) {
      console.error('Failed to create line items:', error);
      return { error: 'Kon bestelling niet vastleggen. Probeer het opnieuw.' };
    }

    // Record coupon usage if coupon was applied
    if (couponId) {
      try {
        await db.insert(couponUsages).values({
          couponId,
          orderId: order.id,
          userId: userId || null,
          discountAmount: discountAmount.toFixed(2),
        });

        // Increment coupon usage count
        await db.execute(`
          UPDATE coupons 
          SET usage_count = usage_count + 1, 
              updated_at = NOW() 
          WHERE id = '${couponId}'
        `);
      } catch (error) {
        console.error('Failed to record coupon usage:', error);
        // Don't fail checkout if coupon tracking fails
      }
    }

    // Create Mollie payment
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const paymentResult = await createMolliePayment({
      orderId: order.id,
      amount: total.toFixed(2),
      currency: 'EUR',
      description: `Bestelling ${order.id.substring(0, 8)} - ${cartItems.length} item(s)`,
      redirectUrl: `${baseUrl}/checkout/success?orderId=${order.id}`,
      webhookUrl: `${baseUrl}/api/webhooks/mollie`,
      metadata: {
        orderId: order.id,
        customerEmail: email,
      },
    });

    if (!paymentResult.success || !paymentResult.paymentUrl) {
      console.error('Failed to create payment:', paymentResult.error);
      return { error: 'Kon betaling niet initiëren. Probeer het opnieuw.' };
    }

    // Return payment URL to redirect user
    return {
      success: true,
      paymentUrl: paymentResult.paymentUrl,
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return { error: 'Er is iets misgegaan. Probeer het opnieuw.' };
  }
}
