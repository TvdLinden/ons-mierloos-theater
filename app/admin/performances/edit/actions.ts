'use server';

import { updateShow } from '@/lib/commands/shows';
import { insertPerformance, deletePerformance } from '@/lib/commands/shows';
import { redirect } from 'next/navigation';
import { setShowTags } from '@/lib/commands/tags';
import { validateImageFile } from '@/lib/utils/performanceFormHelpers';
import { uploadFile } from '@/lib/commands/files';
import { readFormFile, createThumbnail } from '@/lib/utils/image';
import { isValidSlug } from '@/lib/utils/slug';
import { invalidateShowPaths } from '@/lib/utils/invalidateShowPaths';
import type { PerformanceStatus } from '@/lib/db';

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

export async function handleUpdateShow(
  showId: string,
  currentPerformances: CurrentPerformance[],
  prevState: { error?: string },
  formData: FormData,
) {
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
  let thumbnailId: string | undefined = undefined;

  // Handle image upload if provided
  if (image && image.size > 0) {
    const imageValidation = validateImageFile(image);
    if (!imageValidation.valid) {
      return { error: imageValidation.error };
    }

    try {
      const fileType = image.type || '';
      const imageBuffer = await readFormFile(image);
      imageId = await uploadFile(imageBuffer, image.name, fileType);

      // Create and upload thumbnail (200x200)
      const thumbnailBuffer = await createThumbnail(imageBuffer, 200, 200);
      thumbnailId = await uploadFile(thumbnailBuffer, `thumb_${image.name}`, fileType);
    } catch (error) {
      console.error('Error uploading image:', error);
      return { error: 'Fout bij het uploaden van de afbeelding.' };
    }
  }

  try {
    // Update the show
    await updateShow(showId, {
      title,
      subtitle: subtitle.trim() || null,
      description,
      slug,
      basePrice,
      imageId: imageId || null,
      thumbnailImageId: thumbnailId || null,
      publicationDate: publicationDate.trim() ? new Date(publicationDate) : null,
      depublicationDate: depublicationDate.trim() ? new Date(depublicationDate) : null,
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

    // Handle performances - only insert new ones (without IDs)
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
