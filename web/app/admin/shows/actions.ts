'use server';

import {
  updateShow,
  insertShow,
  linkShowToTags,
} from '@ons-mierloos-theater/shared/commands/shows';
import { redirect } from 'next/navigation';
import { setShowTags } from '@ons-mierloos-theater/shared/commands/tags';
import { invalidateShowPaths } from '@/lib/utils/invalidateShowPaths';
import type { ShowStatus } from '@ons-mierloos-theater/shared/db';
import { showFormSchema } from '@/lib/schemas/show';

/**
 * Upserts a show (create or update) with tags.
 * Performance management is now handled on a dedicated page.
 * @param showId Optional - if provided, updates existing show; if null, creates new show
 * @param prevState Previous form state
 * @param formData Form data from the submission
 */
export async function handleUpsertShow(
  showId: string | null,
  prevState: { error?: string },
  formData: FormData,
) {
  const validationResult = showFormSchema.safeParse({
    title: formData.get('title'),
    subtitle: formData.get('subtitle'),
    slug: formData.get('slug'),
    price: formData.get('price'),
    blocks: formData.get('blocks'),
    publicationDate: formData.get('publicationDate'),
    depublicationDate: formData.get('depublicationDate'),
    imageId: formData.get('imageId'),
    tagIds: formData.getAll('tagIds'),
  });

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return { error: firstError?.message || 'Validatiefout.' };
  }

  const {
    title,
    subtitle,
    slug,
    price: basePrice,
    blocks,
    publicationDate,
    depublicationDate,
    imageId,
    tagIds,
  } = validationResult.data;

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

    // Invalidate all paths depending on show data
    invalidateShowPaths(finalShowId);
  } catch (error) {
    console.error('Error upserting show:', error);
    return { error: 'Opslaan mislukt.' };
  }

  // Redirect outside the try-catch to prevent catching Next.js redirect error
  redirect('/admin/shows');
}
