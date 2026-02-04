import { NextRequest, NextResponse } from 'next/server';
import { getTicketByQRToken, scanTicket } from '@ons-mierloos-theater/shared/commands/tickets';
import { db } from '@ons-mierloos-theater/shared/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrToken } = body;

    if (!qrToken) {
      return NextResponse.json({ error: 'QR token is required' }, { status: 400 });
    }

    // Find ticket by QR token
    const ticket = await db.query.tickets.findFirst({
      where: (tickets, { eq }) => eq(tickets.qrToken, qrToken),
      with: {
        performance: {
          with: {
            show: true,
          },
        },
        order: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Ticket niet gevonden',
          message: 'Dit ticket is ongeldig of bestaat niet.',
        },
        { status: 404 },
      );
    }

    // Check if already scanned
    if (ticket.scannedAt) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Ticket al gescand',
          message: `Dit ticket is al gescand op ${new Date(ticket.scannedAt).toLocaleString('nl-NL')}`,
          ticket: {
            ticketNumber: ticket.ticketNumber,
            row: ticket.rowLetter,
            seat: ticket.seatNumber,
            scannedAt: ticket.scannedAt,
          },
        },
        { status: 409 },
      );
    }

    // Mark ticket as scanned
    await scanTicket(qrToken);

    return NextResponse.json({
      valid: true,
      message: 'Ticket geldig - toegang verleend',
      ticket: {
        ticketNumber: ticket.ticketNumber,
        row: ticket.rowLetter,
        seat: ticket.seatNumber,
        customerName: ticket.order.customerName,
        showTitle: ticket.performance.show.title,
        performanceDate: ticket.performance.date,
        scannedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Ticket verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify ticket', details: String(error) },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const qrToken = searchParams.get('qrToken');

    if (!qrToken) {
      return NextResponse.json({ error: 'QR token is required' }, { status: 400 });
    }

    // Find ticket by QR token (read-only check)
    const ticket = await db.query.tickets.findFirst({
      where: (tickets, { eq }) => eq(tickets.qrToken, qrToken),
      with: {
        performance: {
          with: {
            show: true,
          },
        },
        order: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ valid: false, error: 'Ticket niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({
      valid: !ticket.scannedAt,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        row: ticket.rowLetter,
        seat: ticket.seatNumber,
        customerName: ticket.order.customerName,
        showTitle: ticket.performance.show.title,
        performanceDate: ticket.performance.date,
        scannedAt: ticket.scannedAt,
      },
    });
  } catch (error) {
    console.error('Ticket lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup ticket', details: String(error) },
      { status: 500 },
    );
  }
}
