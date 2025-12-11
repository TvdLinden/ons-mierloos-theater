import { db } from '@/lib/db';
import { images, performances, shows, sponsors } from '@/lib/db/schema';
import { eq, notInArray, sql, desc } from 'drizzle-orm';

export type Image = typeof images.$inferSelect;

export async function getImageById(id: string): Promise<Image | null> {
  const result = await db.select().from(images).where(eq(images.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Get all images with pagination
 */
export async function getAllImages(offset = 0, limit = 20): Promise<Image[]> {
  return await db
    .select()
    .from(images)
    .orderBy(desc(images.uploadedAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get total count of images
 */
export async function getImagesCount(): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)::int` }).from(images);
  return result[0]?.count || 0;
}

/**
 * Check if an image is being used by any show or sponsor
 */
export async function getImageUsage(imageId: string): Promise<{
  isUsed: boolean;
  usedBy: Array<{ type: 'show' | 'sponsor'; id: string; name: string }>;
}> {
  const usedBy: Array<{ type: 'show' | 'sponsor'; id: string; name: string }> = [];

  // Check shows using this image
  const showsUsingImage = await db
    .select({ id: shows.id, title: shows.title })
    .from(shows)
    .where(sql`${shows.imageId} = ${imageId} OR ${shows.thumbnailImageId} = ${imageId}`);

  usedBy.push(
    ...showsUsingImage.map((show) => ({
      type: 'show' as const,
      id: show.id,
      name: show.title,
    })),
  );

  // Check sponsors using this image
  const sponsorsUsingImage = await db
    .select({ id: sponsors.id, name: sponsors.name })
    .from(sponsors)
    .where(eq(sponsors.logoId, imageId));

  usedBy.push(
    ...sponsorsUsingImage.map((sponsor) => ({
      type: 'sponsor' as const,
      id: sponsor.id,
      name: sponsor.name,
    })),
  );

  return {
    isUsed: usedBy.length > 0,
    usedBy,
  };
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
