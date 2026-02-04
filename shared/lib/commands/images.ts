import { db, Image } from '../db';
import { images } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { findUnusedImages } from '../queries/images';
import { deleteImageFromR2 } from '../utils/r2ImageStorage';

/**
 * Create a new image with all size variants or R2 URL
 * Supports both legacy bytea storage and new R2 storage
 */
export async function createImage(data: Omit<Image, 'id' | 'uploadedAt'>): Promise<Image> {
  const [image] = await db
    .insert(images)
    .values({
      id: crypto.randomUUID(),
      ...data,
      uploadedAt: new Date(),
    })
    .returning();
  return image;
}

/**
 * Delete a single image by ID
 * Also deletes from R2 if image has r2_url set
 */
export async function deleteImage(id: string): Promise<void> {
  const image = await db.query.images.findFirst({
    where: eq(images.id, id),
  });

  if (image?.r2Url) {
    try {
      await deleteImageFromR2(image.r2Url);
    } catch (error) {
      console.error(`Failed to delete image from R2: ${image.r2Url}`, error);
      // Continue with database deletion even if R2 deletion fails
    }
  }

  await db.delete(images).where(eq(images.id, id));
}

/**
 * Delete multiple images by IDs
 * Also deletes from R2 for any images with r2_url set
 */
export async function deleteImages(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const imagesToDelete = await db.query.images.findMany({
    where: inArray(images.id, ids),
  });

  // Delete from R2 first
  for (const image of imagesToDelete) {
    if (image.r2Url) {
      try {
        await deleteImageFromR2(image.r2Url);
      } catch (error) {
        console.error(`Failed to delete image from R2: ${image.r2Url}`, error);
      }
    }
  }

  // Then delete from database
  await db.delete(images).where(inArray(images.id, ids));
}

/**
 * Delete images that are not referenced by any performance
 * Also deletes from R2 for any images with r2_url set
 * Returns the number of deleted images
 */
export async function removeUnusedImages(): Promise<number> {
  const dangling = await findUnusedImages(0, 1000);

  if (dangling.length === 0) {
    return 0;
  }

  const danglingIds = dangling.map((img) => img.id);

  // Delete from R2 first
  for (const image of dangling) {
    if (image.r2Url) {
      try {
        await deleteImageFromR2(image.r2Url);
      } catch (error) {
        console.error(`Failed to delete image from R2: ${image.r2Url}`, error);
      }
    }
  }

  // Then delete from database
  await db.delete(images).where(inArray(images.id, danglingIds));

  return danglingIds.length;
}
