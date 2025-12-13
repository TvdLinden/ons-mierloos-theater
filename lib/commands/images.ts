import { db, Image } from '@/lib/db';
import { images } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { findUnusedImages } from '@/lib/queries/images';

/**
 * Create a new image with all size variants
 */
export async function createImage(data: Omit<Image, 'id' | 'uploadedAt'>): Promise<Image> {
  const [image] = await db
    .insert({ ...images, uploadedAt: new Date() })
    .values(data)
    .returning();
  return image;
}

/**
 * Delete a single image by ID
 */
export async function deleteImage(id: string): Promise<void> {
  await db.delete(images).where(eq(images.id, id));
}

/**
 * Delete multiple images by IDs
 */
export async function deleteImages(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.delete(images).where(inArray(images.id, ids));
}

/**
 * Delete images that are not referenced by any performance
 * Returns the number of deleted images
 */
export async function removeUnusedImages(): Promise<number> {
  const dangling = await findUnusedImages(0, 1000);

  if (dangling.length === 0) {
    return 0;
  }

  const danglingIds = dangling.map((img) => img.id);

  await db.delete(images).where(inArray(images.id, danglingIds));

  return danglingIds.length;
}
