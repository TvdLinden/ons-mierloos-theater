import { db } from '@/lib/db';
import { images, performances, shows, sponsors } from '@/lib/db/schema';
import { eq, notInArray, sql } from 'drizzle-orm';

export type Image = typeof images.$inferSelect;

export async function getImageById(id: string): Promise<Image | null> {
  const result = await db.select().from(images).where(eq(images.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Find images that are not referenced by any performance or sponsor
 * (not used as imageId, thumbnailImageId, or logoId)
 */
export async function findDanglingImages(): Promise<Image[]> {
  // Get all image IDs referenced by performances
  const performanceImages = await db
    .select({
      id: sql<string>`COALESCE(${shows.imageId}, ${shows.thumbnailImageId})`,
    })
    .from(shows)
    .where(sql`${shows.imageId} IS NOT NULL OR ${shows.thumbnailImageId} IS NOT NULL`);

  // Get all image IDs referenced by sponsors
  const sponsorImages = await db
    .select({
      id: sponsors.logoId,
    })
    .from(sponsors)
    .where(sql`${sponsors.logoId} IS NOT NULL`);

  const referencedIds = [
    ...performanceImages.map((row) => row.id),
    ...sponsorImages.map((row) => row.id),
  ].filter((id): id is string => id != null);

  if (referencedIds.length === 0) {
    // All images are dangling
    return await db.select().from(images);
  }

  // Find images not in the referenced set
  const dangling = await db.select().from(images).where(notInArray(images.id, referencedIds));

  return dangling;
}
