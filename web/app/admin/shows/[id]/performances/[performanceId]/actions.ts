'use server';

import { saveBlockedSeatsForPerformance } from '@ons-mierloos-theater/shared/commands/blockedSeats';
import { revalidatePath } from 'next/cache';

export type BlockSeatInput = {
  rowNumber: number;
  seatNumber: number;
  type: 'reserved' | 'unavailable';
  reason?: string | null;
};

export async function saveBlockedSeatsAction(
  performanceId: string,
  showId: string,
  seats: BlockSeatInput[],
): Promise<{ success: boolean; error?: string }> {
  try {
    await saveBlockedSeatsForPerformance(performanceId, seats);
    revalidatePath(`/admin/shows/${showId}/performances/${performanceId}`);
    return { success: true };
  } catch (error) {
    console.error('Error saving blocked seats:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Er is een fout opgetreden bij het opslaan van geblokkeerde plaatsen.',
    };
  }
}
