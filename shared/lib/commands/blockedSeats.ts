import { db } from '../db';
import { blockedSeats } from '../db/schema';
import { eq } from 'drizzle-orm';
import { updateAvailableSeats } from '../queries/performances';

export type BlockSeatInput = {
  rowNumber: number;
  seatNumber: number;
  type: 'reserved' | 'unavailable';
  reason?: string | null;
};

/**
 * Replace all blocked seats for a performance with the provided list.
 * Computes the delta in available seats and updates accordingly.
 */
export async function saveBlockedSeatsForPerformance(
  performanceId: string,
  newSeats: BlockSeatInput[],
): Promise<void> {
  await db.transaction(async (tx) => {
    // Count current blocked seats
    const current = await tx
      .select({ id: blockedSeats.id })
      .from(blockedSeats)
      .where(eq(blockedSeats.performanceId, performanceId));

    const currentCount = current.length;
    const newCount = newSeats.length;
    const delta = newCount - currentCount; // positive = more blocked, negative = fewer blocked

    // Replace all blocked seats
    await tx.delete(blockedSeats).where(eq(blockedSeats.performanceId, performanceId));

    if (newSeats.length > 0) {
      await tx.insert(blockedSeats).values(
        newSeats.map((s) => ({
          performanceId,
          rowNumber: s.rowNumber,
          seatNumber: s.seatNumber,
          type: s.type,
          reason: s.reason ?? null,
        })),
      );
    }

    // Update available seats atomically — use raw SQL to avoid going below 0
    if (delta !== 0) {
      await updateAvailableSeats(performanceId, -delta);
    }
  });
}
