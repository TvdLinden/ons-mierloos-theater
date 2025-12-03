import {
  db,
  Show,
  ShowWithTags,
  ShowWithPerformances,
  ShowWithTagsAndPerformances,
  Performance,
  PerformanceWithShow,
} from '@/lib/db';
import { shows, performances } from '@/lib/db/schema';
import { eq, and, desc, asc, or, lte, isNull, gte } from 'drizzle-orm';
import { getTagsForShow } from './tags';

/**
 * Get all shows
 */
export async function getAllShows(): Promise<ShowWithTagsAndPerformances[]> {
  const result = await db.query.shows.findMany({
    with: {
      performances: {
        orderBy: [asc(performances.date)],
      },
      showTags: {
        with: { tag: true },
      },
    },
    orderBy: [desc(shows.slug)],
  });

  // Filter out shows with no upcoming performances
  return (
    result
      // .filter((show) => show.performances.length > 0)
      .map((show) => ({
        ...show,
        tags: show.showTags.map((st) => st.tag).filter(Boolean),
      }))
  );
}

/**
 * Get show by ID
 */
export async function getShowById(id: string): Promise<Show | null> {
  const result = await db.select().from(shows).where(eq(shows.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Get show by ID with tags
 */
export async function getShowByIdWithTags(id: string): Promise<ShowWithTags | null> {
  const show = await getShowById(id);
  if (!show) return null;

  const tags = await getTagsForShow(id);
  return { ...show, tags };
}

/**
 * Get show by ID with performances
 */
export async function getShowByIdWithPerformances(
  id: string,
): Promise<ShowWithPerformances | null> {
  const result = await db.query.shows.findFirst({
    where: eq(shows.id, id),
    with: {
      performances: {
        orderBy: [asc(performances.date)],
      },
    },
  });

  return result || null;
}

/**
 * Get show by ID with tags and performances
 */
export async function getShowByIdWithTagsAndPerformances(
  id: string,
): Promise<ShowWithTagsAndPerformances | null> {
  const result = await db.query.shows.findFirst({
    where: eq(shows.id, id),
    with: {
      performances: {
        orderBy: [asc(performances.date)],
      },
      showTags: {
        with: { tag: true },
      },
    },
  });

  if (!result) return null;

  return {
    ...result,
    tags: result.showTags.map((st) => st.tag).filter(Boolean),
  };
}

/**
 * Get show by slug
 */
export async function getShowBySlug(slug: string): Promise<Show | null> {
  const result = await db.select().from(shows).where(eq(shows.slug, slug)).limit(1);
  return result[0] || null;
}

/**
 * Get show by slug with tags
 */
export async function getShowBySlugWithTags(slug: string): Promise<ShowWithTags | null> {
  const show = await getShowBySlug(slug);
  if (!show) return null;

  const tags = await getTagsForShow(show.id);
  return { ...show, tags };
}

/**
 * Get show by slug with performances
 */
export async function getShowBySlugWithPerformances(
  slug: string,
): Promise<ShowWithPerformances | null> {
  const result = await db.query.shows.findFirst({
    where: eq(shows.slug, slug),
    with: {
      performances: {
        orderBy: [asc(performances.date)],
      },
    },
  });

  return result || null;
}

/**
 * Get show by slug with tags and performances
 */
export async function getShowBySlugWithTagsAndPerformances(
  slug: string,
): Promise<ShowWithTagsAndPerformances | null> {
  const result = await db.query.shows.findFirst({
    where: eq(shows.slug, slug),
    with: {
      performances: {
        orderBy: [asc(performances.date)],
      },
      showTags: {
        with: { tag: true },
      },
    },
  });

  if (!result) return null;

  return {
    ...result,
    tags: result.showTags.map((st) => st.tag).filter(Boolean),
  };
}

/**
 * Get all published shows with upcoming performances
 */
export async function getUpcomingShows(): Promise<ShowWithTagsAndPerformances[]> {
  const now = new Date();

  const result = await db.query.shows.findMany({
    where: and(
      eq(shows.status, 'published'),
      or(isNull(shows.publicationDate), lte(shows.publicationDate, now)),
    ),
    with: {
      performances: {
        where: and(gte(performances.date, now), eq(performances.status, 'published')),
        orderBy: [asc(performances.date)],
      },
      showTags: {
        with: { tag: true },
      },
    },
    orderBy: [asc(shows.title)],
  });

  // Filter out shows with no upcoming performances
  return result
    .filter((show) => show.performances.length > 0)
    .map((show) => ({
      ...show,
      tags: show.showTags.map((st) => st.tag).filter(Boolean),
    }));
}

/**
 * Get performance by ID
 */
export async function getPerformanceById(id: string): Promise<Performance | null> {
  const result = await db.select().from(performances).where(eq(performances.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Get performance by ID with show
 */
export async function getPerformanceByIdWithShow(id: string): Promise<PerformanceWithShow | null> {
  const result = await db.query.performances.findFirst({
    where: eq(performances.id, id),
    with: {
      show: true,
    },
  });

  return result || null;
}

/**
 * Get all performances for a show
 */
export async function getPerformancesForShow(showId: string): Promise<Performance[]> {
  return db
    .select()
    .from(performances)
    .where(eq(performances.showId, showId))
    .orderBy(asc(performances.date));
}

/**
 * Get upcoming performances for a show
 */
export async function getUpcomingPerformancesForShow(showId: string): Promise<Performance[]> {
  const now = new Date();
  return db
    .select()
    .from(performances)
    .where(
      and(
        eq(performances.showId, showId),
        gte(performances.date, now),
        eq(performances.status, 'published'),
      ),
    )
    .orderBy(asc(performances.date));
}

/**
 * Get all upcoming performances across all shows
 */
export async function getAllUpcomingPerformances(): Promise<PerformanceWithShow[]> {
  const now = new Date();

  const result = await db.query.performances.findMany({
    where: and(gte(performances.date, now), eq(performances.status, 'published')),
    with: {
      show: true,
    },
    orderBy: [asc(performances.date)],
  });

  return result;
}
