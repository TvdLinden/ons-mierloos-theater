import { uploadFile } from '@/lib/commands/files';
import { readFormFile, createThumbnail } from './image';

export type ImageUploadResult = {
  success: boolean;
  error?: string;
  imageId?: string;
  thumbnailId?: string;
};

/**
 * Handle image upload including thumbnail creation
 */
export async function handleImageUpload(imageFile: File): Promise<ImageUploadResult> {
  try {
    const fileType = imageFile.type || '';

    // Read file buffer
    const imageBuffer = await readFormFile(imageFile);

    // Upload original image
    const imageId = await uploadFile(imageBuffer, imageFile.name, fileType);

    // Create and upload thumbnail (200x200)
    const thumbnailBuffer = await createThumbnail(imageBuffer, 200, 200);
    const thumbnailId = await uploadFile(thumbnailBuffer, `thumb_${imageFile.name}`, fileType);

    return {
      success: true,
      imageId,
      thumbnailId,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: 'Fout bij het uploaden van de afbeelding.',
    };
  }
}
