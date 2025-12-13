import { db, Show, Performance } from '@/lib/db';
import { shows, performances, showTags } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { filterDefinedFields } from '@/lib/utils/filterDefinedFields';
import { generateUniqueSlug, ensureSlug } from '@/lib/utils/slug';
import { getShowBySlug, getPerformanceById } from '@/lib/queries/shows';

// ==================== SHOW OPERATIONS ====================

export async function insertShow(
  show: Omit<Show, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Show> {
  const baseSlug = ensureSlug(show.slug ?? undefined, show.title ?? '');
  const slug = await generateUniqueSlug(baseSlug, async (candidate) => {
    const existing = await getShowBySlug(candidate);
    return existing !== null;
  });

  const cleaned = filterDefinedFields({ ...show, slug } as Partial<Show>, {
    stripEmptyStringsFor: ['id', 'imageId'],
  });

  const result = await db
    .insert(shows)
    .values({
      title: show.title,
      slug,
      status: show.status || 'draft',
      ...cleaned,
    })
    .returning();
  return result[0];
}

export async function updateShow(id: string, fields: Partial<Show>): Promise<void> {
  let updateFields = fields;

  if (fields.slug || fields.title) {
    const baseSlug = ensureSlug(fields.slug ?? undefined, fields.title ?? '');
    const slug = await generateUniqueSlug(baseSlug, async (candidate) => {
      const existing = await getShowBySlug(candidate);
      return existing !== null && existing.id !== id;
    });
    updateFields = { ...fields, slug, updatedAt: new Date() };
  } else {
    updateFields = { ...fields, updatedAt: new Date() };
  }

  const cleaned = filterDefinedFields(updateFields, {
    stripEmptyStringsFor: ['imageId'],
  });

  await db.update(shows).set(cleaned).where(eq(shows.id, id));
}

export async function deleteShow(id: string): Promise<void> {
  // Cascade will delete all performances and show_tags
  await db.delete(shows).where(eq(shows.id, id));
}

export async function linkShowToTags(showId: string, tagIds: string[]): Promise<void> {
  // Delete existing tags for this show
  await db.delete(showTags).where(eq(showTags.showId, showId));

  // Insert new tags
  if (tagIds.length > 0) {
    await db.insert(showTags).values(
      tagIds.map((tagId) => ({
        showId,
        tagId,
      })),
    );
  }
}

// ==================== PERFORMANCE OPERATIONS ====================

export async function insertPerformance(
  performance: Omit<Performance, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Performance> {
  const cleaned = filterDefinedFields(performance as Partial<Performance>, {
    stripEmptyStringsFor: ['id', 'notes'],
  });

  const result = await db
    .insert(performances)
    .values({
      showId: performance.showId,
      date: performance.date,
      status: performance.status || 'draft',
      ...cleaned,
    })
    .returning();
  return result[0];
}

export async function updatePerformance(id: string, fields: Partial<Performance>): Promise<void> {
  const updateFields = { ...fields, updatedAt: new Date() };

  const cleaned = filterDefinedFields(updateFields, {
    stripEmptyStringsFor: ['notes'],
  });

  await db.update(performances).set(cleaned).where(eq(performances.id, id));
}

export async function deletePerformance(id: string): Promise<void> {
  await db.delete(performances).where(eq(performances.id, id));
}

export async function updatePerformanceSeats(id: string, soldCount: number): Promise<void> {
  const performance = await getPerformanceById(id);
  if (!performance) {
    throw new Error('Performance not found');
  }

  const newAvailable = (performance.totalSeats || 0) - soldCount;
  const newStatus = newAvailable <= 0 ? 'sold_out' : performance.status;

  await db
    .update(performances)
    .set({
      availableSeats: newAvailable,
      status: newStatus as Performance['status'],
      updatedAt: new Date(),
    })
    .where(eq(performances.id, id));
}
