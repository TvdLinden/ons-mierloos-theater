import { db } from '@/lib/db';
import { images } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { findDanglingImages } from '@/lib/queries/images';

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
export async function pruneDanglingImages(): Promise<number> {
  const dangling = await findDanglingImages();

  if (dangling.length === 0) {
    return 0;
  }

  const danglingIds = dangling.map((img) => img.id);

  await db.delete(images).where(inArray(images.id, danglingIds));

  return danglingIds.length;
}
