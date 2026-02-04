import { db } from '../db';
import { performances } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Update available seats for a performance
 * Uses atomic database operation to prevent race conditions
 * @param performanceId - UUID of the performance
 * @param delta - Change in seats (negative to decrement, positive to increment)
 * @returns Updated number of available seats
 * @throws Error if not enough seats available or performance not found
 */
export async function updateAvailableSeats(performanceId: string, delta: number): Promise<number> {
  // Use raw SQL to ensure atomic update with concurrency protection
  const result = await db.execute(
    sql`
      UPDATE ${performances}
      SET available_seats = available_seats + ${delta}
      WHERE id = ${performanceId}
      AND available_seats + ${delta} >= 0
      RETURNING available_seats
    `,
  );

  if (result.rows.length === 0) {
    throw new Error(
      `Cannot update seats: insufficient availability or performance not found for ID ${performanceId}`,
    );
  }

  return (result.rows[0]?.available_seats as number) || 0;
}

/**
 * Check if a performance has enough available seats
 * @param performanceId - UUID of the performance
 * @param requiredSeats - Number of seats needed
 * @returns true if enough seats available, false otherwise
 */
export async function validateSeatsAvailable(
  performanceId: string,
  requiredSeats: number,
): Promise<boolean> {
  const performance = await db.query.performances.findFirst({
    where: eq(performances.id, performanceId),
  });

  return performance ? performance.availableSeats >= requiredSeats : false;
}

/**
 * Reserve (decrement) seats for a performance
 * @param performanceId - UUID of the performance
 * @param quantity - Number of seats to reserve
 * @throws Error if not enough seats available
 */
export async function reserveSeats(performanceId: string, quantity: number): Promise<void> {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  const available = await validateSeatsAvailable(performanceId, quantity);
  if (!available) {
    throw new Error(
      `Not enough seats available for performance ${performanceId} (need ${quantity})`,
    );
  }

  await updateAvailableSeats(performanceId, -quantity);
}

/**
 * Release (increment) seats back to a performance
 * Used when payment fails or order is cancelled
 * @param performanceId - UUID of the performance
 * @param quantity - Number of seats to release
 */
export async function releaseSeats(performanceId: string, quantity: number): Promise<void> {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  await updateAvailableSeats(performanceId, quantity);
}

/**
 * Get seat availability for multiple performances
 * @param performanceIds - Array of performance UUIDs
 * @returns Map of performanceId -> availableSeats
 */
export async function getSeatsAvailable(performanceIds: string[]): Promise<Map<string, number>> {
  const results = await db.query.performances.findMany({
    where: sql`${performances.id} = ANY(${performanceIds})`,
  });

  const seatMap = new Map<string, number>();
  for (const perf of results) {
    seatMap.set(perf.id, perf.availableSeats);
  }
  return seatMap;
}
