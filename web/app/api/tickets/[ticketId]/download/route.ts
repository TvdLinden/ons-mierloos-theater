import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { getTicketById } from '@ons-mierloos-theater/shared/queries/orders';
import { generateTicketPDF } from '@ons-mierloos-theater/shared/utils/ticketGenerator';

export async function GET(request: Request, context: { params: Promise<{ ticketId: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { ticketId } = await context.params;
    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return new Response('Ticket not found', { status: 404 });
    }

    // Verify order exists and belongs to user
    if (!ticket.order || ticket.order.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    // Only allow download if order is paid
    if (ticket.order.status !== 'paid') {
      return new Response('Order not yet confirmed', { status: 403 });
    }

    // Verify ticket belongs to this order
    if (ticket.orderId !== ticket.order.id) {
      return new Response('Forbidden', { status: 403 });
    }

    // Generate the PDF
    const pdfBuffer = await generateTicketPDF(ticket);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ticket-${ticket.ticketNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error downloading ticket:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
