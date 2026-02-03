import { db, Ticket, Performance } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type CreateTicket = Omit<Ticket, 'id' | 'qrToken' | 'createdAt' | 'scannedAt'> & {
  qrToken?: string;
};

import { assignSeats } from '@/lib/utils/seatAssignment';

/**
 * Create individual tickets for a line item with smart seat assignment.
 * Queries actually-occupied seats to handle non-sequential assignment correctly.
 */
export async function createTicketsForLineItem(
  lineItemId: string,
  performanceId: string,
  orderId: string,
  quantity: number,
  performance: Performance,
  wheelchairAccess: boolean = false,
): Promise<Ticket[]> {
  const seatsPerRow = performance.seatsPerRow || 20;
  const rows = performance.rows || 5;

  // Query actually occupied seats for this performance
  const existingTickets = await db
    .select({ rowLetter: tickets.rowLetter, seatNumber: tickets.seatNumber })
    .from(tickets)
    .where(eq(tickets.performanceId, performanceId));

  const occupiedSeats = new Set<string>();
  for (const t of existingTickets) {
    const rowIndex = t.rowLetter.charCodeAt(0) - 65; // A=0, B=1, ...
    occupiedSeats.add(`${rowIndex}-${t.seatNumber}`);
  }

  // Assign seats using the smart algorithm
  const assignedSeats = assignSeats(occupiedSeats, rows, seatsPerRow, quantity, wheelchairAccess);

  if (assignedSeats.length < quantity) {
    throw new Error(
      `Kon maar ${assignedSeats.length} van ${quantity} plaatsen toewijzen voor deze voorstelling.`,
    );
  }

  const ticketsToCreate: CreateTicket[] = assignedSeats.map(({ rowIndex, seatNumber }) => {
    const rowLetter = String.fromCharCode(65 + rowIndex);
    const ticketNumber = `${performance.showId.substring(0, 4).toUpperCase()}-${performanceId.substring(0, 4).toUpperCase()}-${rowLetter}${seatNumber}`;
    return {
      lineItemId,
      performanceId,
      orderId,
      ticketNumber,
      rowLetter,
      seatNumber,
    };
  });

  const createdTickets = await db.insert(tickets).values(ticketsToCreate).returning();

  return createdTickets;
}

/**
 * Get ticket by QR token
 */
export async function getTicketByQRToken(qrToken: string): Promise<Ticket | null> {
  const [ticket] = await db.select().from(tickets).where(eq(tickets.qrToken, qrToken)).limit(1);

  return ticket || null;
}

/**
 * Mark ticket as scanned
 */
export async function scanTicket(qrToken: string): Promise<Ticket | null> {
  const [ticket] = await db
    .update(tickets)
    .set({ scannedAt: new Date() })
    .where(eq(tickets.qrToken, qrToken))
    .returning();

  return ticket || null;
}

/**
 * Get all tickets for an order
 */
export async function getTicketsByOrderId(orderId: string): Promise<Ticket[]> {
  return await db.select().from(tickets).where(eq(tickets.orderId, orderId));
}

/**
 * Get all tickets for a line item
 */
export async function getTicketsByLineItemId(lineItemId: string): Promise<Ticket[]> {
  return await db.select().from(tickets).where(eq(tickets.lineItemId, lineItemId));
}
