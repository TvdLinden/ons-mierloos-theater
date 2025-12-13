import { db, Ticket, Performance } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export type CreateTicket = Omit<Ticket, 'id' | 'qrToken' | 'createdAt' | 'scannedAt'> & {
  qrToken?: string;
};

/**
 * Create individual tickets for a line item with sequential seat assignments
 */
export async function createTicketsForLineItem(
  lineItemId: string,
  performanceId: string,
  orderId: string,
  quantity: number,
  performance: Performance,
): Promise<Ticket[]> {
  const seatsPerRow = performance.seatsPerRow || 20;
  const rows = performance.rows || 5;
  const totalCapacity = rows * seatsPerRow;

  // Calculate how many seats are already assigned
  const seatsAlreadyAssigned = totalCapacity - (performance.availableSeats || 0);

  const ticketsToCreate: CreateTicket[] = [];

  for (let i = 0; i < quantity; i++) {
    const seatIndex = seatsAlreadyAssigned + i;

    // Calculate row and seat number
    const rowIndex = Math.floor(seatIndex / seatsPerRow);
    const rowLetter = String.fromCharCode(65 + rowIndex); // A, B, C, ...
    const seatNumber = (seatIndex % seatsPerRow) + 1; // 1-20

    // Generate ticket number: SHOW-PERF-RijStoel
    const ticketNumber = `${performance.showId.substring(0, 4).toUpperCase()}-${performanceId.substring(0, 4).toUpperCase()}-${rowLetter}${seatNumber}`;

    ticketsToCreate.push({
      lineItemId,
      performanceId,
      orderId,
      ticketNumber,
      rowLetter,
      seatNumber,
    });
  }

  // Insert all tickets
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
