import { db } from '@/lib/db';
import { images } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { findDanglingImages } from '@/lib/queries/images';

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
