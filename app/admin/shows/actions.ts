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
import { isValidSlug } from '@/lib/utils/slug';
import { invalidateShowPaths } from '@/lib/utils/invalidateShowPaths';
import type { PerformanceStatus, ShowStatus } from '@/lib/db';
import { Blocks } from 'lucide-react';
import { BlocksArray, blocksArraySchema } from '@/lib/schemas/blocks';

type NewPerformance = {
  id?: string;
  date: string;
  price: string;
  rows: number;
  seatsPerRow: number;
  availableSeats: number;
  status: PerformanceStatus;
  notes?: string;
};

type CurrentPerformance = {
  id: string;
  [key: string]: any;
};

/**
 * Upserts a show (create or update) with performances and tags.
 * @param showId Optional - if provided, updates existing show; if null, creates new show
 * @param currentPerformances Optional - current performances (only used when updating)
 * @param prevState Previous form state
 * @param formData Form data from the submission
 */
export async function handleUpsertShow(
  showId: string | null,
  currentPerformances: CurrentPerformance[] = [],
  prevState: { error?: string },
  formData: FormData,
) {
  // Parse basic show fields
  const title = formData.get('title') as string;
  const subtitle = formData.get('subtitle') as string;
  const blocksJson = formData.get('blocks') as string;
  const slug = formData.get('slug') as string;
  const basePrice = formData.get('price') as string;
  const publicationDate = formData.get('publicationDate') as string;
  const depublicationDate = formData.get('depublicationDate') as string;
  const imageId = formData.get('imageId') as string | null;
  const tagIds = formData.getAll('tagIds') as string[];

  // Parse performances array from hidden inputs
  const performancesData = formData.getAll('performances') as string[];
  const performances: NewPerformance[] = performancesData.map((p) => JSON.parse(p));

  // Validate basic fields
  if (!title) {
    return { error: 'Titel is verplicht.' };
  }

  let blocks: BlocksArray = [];
  if (blocksJson) {
    try {
      const parsed = JSON.parse(blocksJson);
      blocks = blocksArraySchema.parse(parsed);
    } catch (error) {
      console.error('Error parsing blocks:', error);
      return { error: 'Ongeldige inhoud.' };
    }
  } else {
    return { error: 'Inhoud is verplicht.' };
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

  let finalShowId: string;

  // Handle image - now it's just an ID selected from existing images
  const finalImageId = imageId && imageId.trim() ? imageId.trim() : undefined;

  try {
    if (showId) {
      // UPDATE existing show
      const updateFields: any = {
        title,
        subtitle: subtitle?.trim() || null,
        blocks,
        slug,
        basePrice,
        publicationDate: publicationDate?.trim() ? new Date(publicationDate) : null,
        depublicationDate: depublicationDate?.trim() ? new Date(depublicationDate) : null,
      };

      // Only add imageId if a new image was selected
      if (finalImageId !== undefined) {
        updateFields.imageId = finalImageId;
      }

      await updateShow(showId, updateFields);

      finalShowId = showId;

      // Track which performances exist in the current show
      const currentPerformanceIds = new Set(currentPerformances?.map((p) => p.id) || []);
      const submittedPerformanceIds = new Set(performances.filter((p) => p.id).map((p) => p.id!));

      // Delete performances that were removed
      for (const perfId of currentPerformanceIds) {
        if (!submittedPerformanceIds.has(perfId)) {
          await deletePerformance(perfId);
        }
      }
    } else {
      // INSERT new show
      const show = await insertShow({
        title,
        subtitle: subtitle?.trim() || null,
        slug,
        blocks,
        basePrice,
        status: 'draft' as ShowStatus,
        imageId: finalImageId,
        publicationDate: publicationDate?.trim() ? new Date(publicationDate) : null,
        depublicationDate: depublicationDate?.trim() ? new Date(depublicationDate) : null,
      });

      finalShowId = show.id;
    }

    // Update tags (works for both insert and update)
    await setShowTags(finalShowId, tagIds);

    // Insert new performances (those without IDs)
    const newPerformances = performances.filter((p) => !p.id);
    if (newPerformances.length > 0) {
      for (const perf of newPerformances) {
        await insertPerformance({
          showId: finalShowId,
          date: new Date(perf.date),
          price: perf.price,
          rows: perf.rows,
          seatsPerRow: perf.seatsPerRow,
          totalSeats: perf.rows * perf.seatsPerRow,
          availableSeats: perf.availableSeats,
          status: perf.status,
          notes: perf.notes || null,
        });
      }
    }

    // Invalidate all paths depending on show data
    invalidateShowPaths(finalShowId);
  } catch (error) {
    console.error('Error upserting show:', error);
    return { error: 'Opslaan mislukt.' };
  }

  // Redirect outside the try-catch to prevent catching Next.js redirect error
  redirect('/admin/shows');
}
