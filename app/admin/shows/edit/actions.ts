'use server';

import {
  updateShow,
  insertShow,
  insertPerformance,
  deletePerformance,
  linkShowToTags,
} from '@/lib/commands/shows';
import { redirect } from 'next/navigation';
import { setShowTags } from '@/lib/commands/tags';
import { validateImageFile } from '@/lib/utils/performanceFormHelpers';
import { handleImageUpload } from '@/lib/utils/imageUpload';
import { isValidSlug } from '@/lib/utils/slug';
import { invalidateShowPaths } from '@/lib/utils/invalidateShowPaths';
import type { PerformanceStatus, ShowStatus } from '@/lib/db';

type NewPerformance = {
  id?: string;
  date: string;
  price: string;
  totalSeats: number;
  availableSeats: number;
  status: PerformanceStatus;
  notes?: string;
};

type CurrentPerformance = {
  id: string;
  [key: string]: any;
};

/**
 * Handles updating an existing show with performances and tags.
 * @param showId The ID of the show to update
 * @param currentPerformances The current performances of the show
 * @param prevState Previous form state
 * @param formData Form data from the submission
 */
export async function handleUpdateShowAction(
  showId: string,
  currentPerformances: CurrentPerformance[],
  prevState: { error?: string },
  formData: FormData,
) {
  // Parse basic show fields
  const title = formData.get('title') as string;
  const subtitle = formData.get('subtitle') as string;
  const description = formData.get('description') as string;
  const slug = formData.get('slug') as string;
  const basePrice = formData.get('price') as string;
  const publicationDate = formData.get('publicationDate') as string;
  const depublicationDate = formData.get('depublicationDate') as string;
  const image = formData.get('image') as File;
  const tagIds = formData.getAll('tagIds') as string[];

  // Parse performances array from hidden inputs
  const performancesData = formData.getAll('performances') as string[];
  const performances: NewPerformance[] = performancesData.map((p) => JSON.parse(p));

  // Validate basic fields
  if (!title || !description) {
    return { error: 'Titel en beschrijving zijn verplicht.' };
  }

  if (!isValidSlug(slug)) {
    return {
      error: 'Slug is verplicht en mag alleen kleine letters, cijfers en streepjes bevatten.',
    };
  }

  if (!basePrice || isNaN(Number(basePrice)) || !/^\d+(\.\d{1,2})?$/.test(basePrice)) {
    return {
      error: 'Prijs is verplicht en moet een geldig decimaal getal zijn (max 2 decimalen).',
    };
  }

  let imageId: string | undefined = undefined;

  // Handle image upload if provided
  if (image && image.size > 0) {
    const imageValidation = validateImageFile(image);
    if (!imageValidation.valid) {
      return { error: imageValidation.error };
    }

    const uploadResult = await handleImageUpload(image);
    if (!uploadResult.success) {
      return { error: uploadResult.error };
    }

    imageId = uploadResult.imageId;
  }

  try {
    // Update the show
    await updateShow(showId, {
      title,
      subtitle: subtitle || null,
      description,
      slug,
      basePrice,
      imageId: imageId || null,
      publicationDate: publicationDate ? new Date(publicationDate) : null,
      depublicationDate: depublicationDate ? new Date(depublicationDate) : null,
    });

    // Update tags
    await setShowTags(showId, tagIds);

    // Track which performances exist in the current show
    const currentPerformanceIds = new Set(currentPerformances?.map((p) => p.id) || []);
    const submittedPerformanceIds = new Set(performances.filter((p) => p.id).map((p) => p.id!));

    // Delete performances that were removed
    for (const perfId of currentPerformanceIds) {
      if (!submittedPerformanceIds.has(perfId)) {
        await deletePerformance(perfId);
      }
    }

    // Insert only new performances (without IDs)
    const newPerformances = performances.filter((p) => !p.id);
    if (newPerformances.length > 0) {
      for (const perf of newPerformances) {
        await insertPerformance({
          showId: showId,
          date: new Date(perf.date),
          price: perf.price,
          totalSeats: perf.totalSeats,
          availableSeats: perf.availableSeats,
          status: perf.status,
          notes: perf.notes || null,
        });
      }
    }
  } catch (error) {
    console.error('Error updating show:', error);
    return { error: 'Opslaan mislukt.' };
  }

  // Invalidate all paths depending on show data
  invalidateShowPaths(showId);

  redirect('/admin/performances');
}

/**
 * Handles creating a new show with initial performances and tags.
 * @param prevState Previous form state
 * @param formData Form data from the submission
 */
export async function handleAddShowAction(prevState: { error?: string }, formData: FormData) {
  const title = formData.get('title') as string;
  const subtitle = formData.get('subtitle') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const basePrice = formData.get('price') as string;
  const publicationDate = formData.get('publicationDate') as string;
  const depublicationDate = formData.get('depublicationDate') as string;
  const image = formData.get('image') as File;
  const tagIds = formData.getAll('tagIds') as string[];

  // Parse performances array from hidden inputs
  const performancesData = formData.getAll('performances') as string[];
  const performances: NewPerformance[] = performancesData.map((p) => JSON.parse(p));

  if (!title || !description) {
    return { error: 'Titel en beschrijving zijn verplicht.' };
  }

  if (!isValidSlug(slug)) {
    return {
      error: 'Slug is verplicht en mag alleen kleine letters, cijfers en streepjes bevatten.',
    };
  }

  if (!basePrice || isNaN(Number(basePrice)) || !/^\d+(\.\d{1,2})?$/.test(basePrice)) {
    return {
      error: 'Basisprijs is verplicht en moet een geldig decimaal getal zijn (max 2 decimalen).',
    };
  }

  let imageId: string | undefined = undefined;

  if (image && image.size > 0) {
    const imageValidation = validateImageFile(image);
    if (!imageValidation.valid) {
      return { error: imageValidation.error };
    }

    const uploadResult = await handleImageUpload(image);
    if (!uploadResult.success) {
      return { error: uploadResult.error };
    }

    imageId = uploadResult.imageId;
  }

  try {
    const show = await insertShow({
      title,
      subtitle: subtitle?.trim() || null,
      slug,
      description,
      basePrice,
      status: 'draft' as ShowStatus,
      imageId: imageId || undefined,
      publicationDate: publicationDate?.trim() ? new Date(publicationDate) : null,
      depublicationDate: depublicationDate?.trim() ? new Date(depublicationDate) : null,
    });

    // Link tags if provided
    if (tagIds && tagIds.length > 0) {
      await linkShowToTags(show.id, tagIds);
    }

    // Insert initial performances (all new performances without IDs)
    if (performances.length > 0) {
      for (const perf of performances) {
        await insertPerformance({
          showId: show.id,
          date: new Date(perf.date),
          price: perf.price,
          totalSeats: perf.totalSeats,
          availableSeats: perf.availableSeats,
          status: perf.status,
          notes: perf.notes || null,
        });
      }
    }

    // Invalidate all paths depending on show data
    invalidateShowPaths();

    redirect(`/admin/shows/${show.id}/performances`);
  } catch (error) {
    console.error('Error inserting show:', error);
    return { error: 'Opslaan mislukt.' };
  }
}
