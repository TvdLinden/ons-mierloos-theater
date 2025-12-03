import { NextRequest, NextResponse } from 'next/server';
import { db, Payment } from '@/lib/db';
import { payments, orders, lineItems, couponUsages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updatePaymentStatus, updateOrderStatus } from '@/lib/commands/payments';
import { sendOrderConfirmationEmail } from '@/lib/utils/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id: mockPaymentId, status } = body;

    if (!mockPaymentId || !status) {
      return NextResponse.json({ error: 'Missing payment ID or status' }, { status: 400 });
    }

    // Find payment in our database
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.providerTransactionId, mockPaymentId))
      .limit(1);

    if (!payment) {
      console.error('Payment not found:', mockPaymentId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Map mock status to our payment status
    let paymentStatus: Payment['status'];
    let orderStatus: 'pending' | 'paid' | 'failed' | 'cancelled';

    switch (status) {
      case 'paid':
        paymentStatus = 'succeeded';
        orderStatus = 'paid';
        break;
      case 'failed':
        paymentStatus = 'failed';
        orderStatus = 'failed';
        break;
      case 'canceled':
        paymentStatus = 'cancelled';
        orderStatus = 'cancelled';
        break;
      default:
        paymentStatus = 'processing';
        orderStatus = 'pending';
    }

    // Update payment status
    await updatePaymentStatus(
      payment.id,
      paymentStatus,
      paymentStatus === 'succeeded' ? new Date() : undefined,
    );

    // Update order status
    await updateOrderStatus(payment.orderId, orderStatus);

    console.log('Mock payment processed:', { mockPaymentId, status, orderId: payment.orderId });

    // If payment succeeded, send confirmation email
    if (orderStatus === 'paid') {
      try {
        console.log('Fetching order details for email...', payment.orderId);

        const order = await db.query.orders.findFirst({
          where: eq(orders.id, payment.orderId),
        });

        const orderLineItems = await db.query.lineItems.findMany({
          where: eq(lineItems.orderId, payment.orderId),
          with: {
            performance: {
              with: {
                show: true,
              },
            },
          },
        });

        const orderCouponUsages = await db.query.couponUsages.findMany({
          where: eq(couponUsages.orderId, payment.orderId),
          with: {
            coupon: true,
          },
        });

        console.log('Order found:', order ? 'yes' : 'no');
        console.log('Line items found:', orderLineItems.length);
        console.log('Coupons applied:', orderCouponUsages.length);

        if (order && orderLineItems.length > 0) {
          console.log('Sending confirmation email to:', order.customerEmail);
          const emailResult = await sendOrderConfirmationEmail(
            order,
            orderLineItems,
            orderCouponUsages,
          );

          if (emailResult.success) {
            console.log('✓ Confirmation email sent successfully for order:', payment.orderId);
          } else {
            console.error('✗ Failed to send email:', emailResult.error);
          }
        } else {
          console.warn('Cannot send email: order or line items not found');
        }
      } catch (emailError) {
        console.error('Exception while sending confirmation email:', emailError);
        // Don't fail the webhook if email fails
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Mock webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
