'use server';

import { deleteImage, removeUnusedImages } from '@/lib/commands/images';
import { getImageUsage } from '@/lib/queries/images';
import { handleImageUpload } from '@/lib/utils/imageUpload';
import { validateImageFile } from '@/lib/utils/performanceFormHelpers';
import { revalidatePath } from 'next/cache';

export async function deleteImageAction(imageId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check if image is in use
    const usage = await getImageUsage(imageId);
    if (usage.isUsed) {
      const usageList = usage.usedBy.map((u) => `${u.type}: ${u.name}`).join(', ');
      return {
        success: false,
        error: `Deze afbeelding wordt gebruikt door: ${usageList}. Verwijder eerst deze koppelingen.`,
      };
    }

    await deleteImage(imageId);
    revalidatePath('/admin/images');

    return { success: true };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      error: 'Er is een fout opgetreden bij het verwijderen van de afbeelding.',
    };
  }
}

export async function uploadImageAction(
  prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const image = formData.get('image') as File | null;

  if (!image || image.size === 0) {
    return { error: 'Selecteer een afbeelding om te uploaden.' };
  }

  const imageValidation = validateImageFile(image);
  if (!imageValidation.valid) {
    return { error: imageValidation.error };
  }

  try {
    const uploadResult = await handleImageUpload(image);
    if (!uploadResult.success) {
      return { error: uploadResult.error };
    }

    revalidatePath('/admin/images');
    return { success: true };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { error: 'Er is een fout opgetreden bij het uploaden van de afbeelding.' };
  }
}

export async function pruneImagesAction(): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  deletedCount?: number;
}> {
  try {
    const deletedCount = await removeUnusedImages();
    revalidatePath('/admin/images');

    return {
      success: true,
      deletedCount,
      message: `${deletedCount} ongebruikte afbeelding${deletedCount !== 1 ? 'en' : ''} verwijderd`,
    };
  } catch (error) {
    console.error('Error pruning images:', error);
    return {
      success: false,
      error: 'Er is een fout opgetreden bij het opschonen van afbeeldingen.',
    };
  }
}
