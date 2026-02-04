import { db, Image } from '../db';
import { images, shows, sponsors } from '../db/schema';
import { eq, notInArray, sql, desc } from 'drizzle-orm';
import { mime } from 'zod';

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
    .where(sql`${shows.imageId} = ${imageId}`);

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
import { newsArticles } from '../db/schema';

export async function findUnusedImages(offset = 0, limit = 50): Promise<Image[]> {
  // Single SQL: NOT EXISTS subqueries for each referencing table/column.
  const rows = await db
    .select()
    .from(images)
    .where(
      sql`NOT EXISTS (SELECT 1 FROM ${shows} WHERE ${shows.imageId} = ${images.id})
        AND NOT EXISTS (SELECT 1 FROM ${sponsors} WHERE ${sponsors.logoId} = ${images.id})
        AND NOT EXISTS (SELECT 1 FROM ${newsArticles} WHERE ${newsArticles.imageId} = ${images.id})`,
    )
    .orderBy(desc(images.uploadedAt))
    .limit(limit)
    .offset(offset);

  return rows;
}
