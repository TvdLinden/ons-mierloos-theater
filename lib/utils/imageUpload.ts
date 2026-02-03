import { readFormFile } from './image';
import sharp from 'sharp';
import { uploadImageToR2 } from './r2ImageStorage';
import { createImage } from '../commands/images';

export type ImageUploadResult = {
  success: boolean;
  error?: string;
  imageId?: string;
  r2Url?: string;
};

/**
 * Handle image upload to R2 with automatic processing
 * Processes image with Sharp: auto-rotate, resize to max 2400px, convert to JPEG 90%
 */
export async function handleImageUpload(imageFile: File): Promise<ImageUploadResult> {
  try {
    // Read file buffer
    const imageBuffer = await readFormFile(imageFile);

    // Process with Sharp: rotate, resize, convert to JPEG
    const pipeline = sharp(imageBuffer)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true }) // Max 2400px
      .jpeg({ quality: 90 });

    const processedBuffer = await pipeline.toBuffer();
    const metadata = await sharp(imageBuffer).metadata();

    // Upload to R2
    const r2Url = await uploadImageToR2(processedBuffer, imageFile.name, 'image/jpeg');

    // Save to database with R2 URL and dimensions
    const image = await createImage({
      filename: imageFile.name,
      mimetype: 'image/jpeg',
      r2Url,
      originalWidth: metadata.width || null,
      originalHeight: metadata.height || null,
    });

    return {
      success: true,
      imageId: image.id,
      r2Url: image.r2Url,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: 'Fout bij het uploaden van de afbeelding.',
    };
  }
}
