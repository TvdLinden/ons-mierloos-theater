import { db } from '../db';
import { tags, showTags } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Insert a new tag
 */
export async function insertTag(data: { name: string; slug: string; description?: string }) {
  const result = await db.insert(tags).values(data).returning();
  return result[0];
}

/**
 * Update an existing tag
 */
export async function updateTag(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
  },
) {
  const result = await db.update(tags).set(data).where(eq(tags.id, id)).returning();
  return result[0] ?? null;
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string) {
  await db.delete(tags).where(eq(tags.id, id));
}

/**
 * Add a tag to a Show
 */
export async function addTagToShow(showId: string, tagId: string) {
  const result = await db.insert(showTags).values({ showId, tagId }).returning();
  return result[0];
}

/**
 * Remove a tag from a Show
 */
export async function removeTagFromShow(showId: string, tagId: string) {
  await db.delete(showTags).where(and(eq(showTags.showId, showId), eq(showTags.tagId, tagId)));
}

/**
 * Set all tags for a Show (replaces existing tags)
 */
export async function setShowTags(showId: string, tagIds: string[]) {
  // Remove all existing tags
  await db.delete(showTags).where(eq(showTags.showId, showId));

  // Add new tags if any
  if (tagIds.length > 0) {
    await db.insert(showTags).values(tagIds.map((tagId) => ({ showId, tagId })));
  }
}
