import { db } from '../db';
import { tags, showTags } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get all tags
 */
export async function getAllTags() {
  return await db.select().from(tags).orderBy(tags.name);
}

/**
 * Get a tag by ID
 */
export async function getTagById(id: string) {
  const result = await db.select().from(tags).where(eq(tags.id, id));
  return result[0] ?? null;
}

/**
 * Get a tag by slug
 */
export async function getTagBySlug(slug: string) {
  const result = await db.select().from(tags).where(eq(tags.slug, slug));
  return result[0] ?? null;
}

/**
 * Get all tags for a specific show
 */
export async function getTagsForShow(showId: string) {
  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      description: tags.description,
      createdAt: tags.createdAt,
    })
    .from(showTags)
    .innerJoin(tags, eq(showTags.tagId, tags.id))
    .where(eq(showTags.showId, showId));

  return result;
}

/**
 * Get all shows for a specific tag
 */
export async function getShowsByTag(tagId: string) {
  const result = await db
    .select({ showId: showTags.showId })
    .from(showTags)
    .where(eq(showTags.tagId, tagId));

  return result.map((r) => r.showId);
}
