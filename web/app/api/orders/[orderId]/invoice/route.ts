import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { getOrderById } from '@ons-mierloos-theater/shared/queries/orders';
import { generateInvoicePDF } from '@ons-mierloos-theater/shared/utils/invoiceGenerator';

export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { orderId } = await context.params;

    // Validate order ID format
    if (!orderId || typeof orderId !== 'string') {
      return new Response('Invalid order ID', { status: 400 });
    }

    const order = await getOrderById(orderId);

    if (!order) {
      return new Response('Order not found', { status: 404 });
    }

    // Strict ownership verification
    if (!order.userId || order.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    // Only allow download if order is paid
    if (order.status !== 'paid') {
      return new Response('Order not yet confirmed', { status: 403 });
    }

    // Verify line items exist
    if (!order.lineItems || order.lineItems.length === 0) {
      return new Response('Invalid order', { status: 400 });
    }

    // Generate the PDF
    const pdfBuffer = await generateInvoicePDF(order, order.lineItems, order.couponUsages || []);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${order.id.substring(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error downloading invoice:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
