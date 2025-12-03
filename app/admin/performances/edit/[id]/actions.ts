'use server';

import { updatePerformance } from '@/lib/commands/shows';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type FormState = {
  error?: string;
  performanceId?: string;
  showId?: string;
};

export async function updatePerformanceAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const performanceId = formData.get('performanceId') as string;
  const showId = formData.get('showId') as string;
  const date = formData.get('date') as string;
  const price = formData.get('price') as string;
  const totalSeats = formData.get('totalSeats') as string;
  const availableSeats = formData.get('availableSeats') as string;
  const status = formData.get('status') as string;
  const notes = formData.get('notes') as string;

  if (!date) {
    return { error: 'Datum en tijd zijn verplicht.', performanceId, showId };
  }

  if (price && (isNaN(Number(price)) || !/^\d+(\.\d{1,2})?$/.test(price))) {
    return {
      error: 'Prijs moet een geldig decimaal getal zijn (max 2 decimalen).',
      performanceId,
      showId,
    };
  }

  try {
    await updatePerformance(performanceId, {
      date: new Date(date),
      price: price || null,
      totalSeats: totalSeats ? parseInt(totalSeats) : undefined,
      availableSeats: availableSeats ? parseInt(availableSeats) : undefined,
      status: (status as 'draft' | 'published' | 'sold_out' | 'cancelled' | 'archived') || 'draft',
      notes: notes || null,
    });

    revalidatePath('/admin/performances');
    revalidatePath(`/admin/shows/${showId}/performances`);
  } catch (error) {
    console.error('Error updating performance:', error);
    return { error: 'Opslaan mislukt.', performanceId, showId };
  }

  redirect(`/admin/shows/${showId}/performances`);
}
