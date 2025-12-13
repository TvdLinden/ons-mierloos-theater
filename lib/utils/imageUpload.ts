import { readFormFile, createThumbnail } from './image';
import { generateImageVariants } from './imageProcessor';
import { createImage } from '../commands/images';

export type ImageUploadResult = {
  success: boolean;
  error?: string;
  imageId?: string;
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
    const { sm, md, lg } = await generateImageVariants(imageBuffer);
    const image = await createImage({
      filename: imageFile.name,
      mimetype: fileType,
      imageLg: lg,
      imageMd: md,
      imageSm: sm,
    });

    return {
      success: true,
      imageId: image.id,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: 'Fout bij het uploaden van de afbeelding.',
    };
  }
}
