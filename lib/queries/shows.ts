import { cache } from 'react';
import {
  db,
  Show,
  ShowWithTags,
  ShowWithPerformances,
  ShowWithTagsAndPerformances,
  Performance,
  PerformanceWithShow,
} from '@/lib/db';
import { shows, performances, showTags, tags } from '@/lib/db/schema';
import { eq, and, desc, asc, or, lte, isNull, gte, inArray, lt, count, exists } from 'drizzle-orm';
import { getTagsForShow } from './tags';
import { BlocksArray, blocksArraySchema } from '../schemas/blocks';

/**
 * Get all shows
 */
export async function getAllShows(): Promise<ShowWithTagsAndPerformances[]> {
  const result = await db.query.shows.findMany({
    with: {
      image: true,
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
      image: true,
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
): Promise<(ShowWithTagsAndPerformances & { blocks: BlocksArray }) | null> {
  const result = await db.query.shows.findFirst({
    where: eq(shows.id, id),
    with: {
      image: true,
      performances: {
        orderBy: [asc(performances.date)],
      },
      showTags: {
        with: { tag: true },
      },
    },
  });

  if (!result) return null;

  // Parse and validate blocks
  const blocks = result.blocks
    ? (() => {
        try {
          const parsed = JSON.parse(JSON.stringify(result.blocks));
          return blocksArraySchema.parse(parsed);
        } catch {
          return undefined;
        }
      })()
    : undefined;

  return {
    ...result,
    blocks: blocks || [],
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
      image: true,
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
export const getShowBySlugWithTagsAndPerformances = cache(
  async (slug: string): Promise<ShowWithTagsAndPerformances | null> => {
    const result = await db.query.shows.findFirst({
      where: eq(shows.slug, slug),
      with: {
        image: true,
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
  },
);

/**
 * Get show by slug with available (future and published) performances only
 * Used for the show detail page to prevent users from selecting past performances
 */
export async function getShowBySlugWithAvailablePerformances(
  slug: string,
): Promise<ShowWithTagsAndPerformances | null> {
  const now = new Date();

  const result = await db.query.shows.findFirst({
    where: eq(shows.slug, slug),
    with: {
      image: true,
      performances: {
        where: and(gte(performances.date, now), eq(performances.status, 'published')),
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
 * Resolve a tag filter (mix of slugs and UUIDs) into matching show IDs.
 * Returns null when no shows match, so callers can short-circuit.
 */
async function resolveTagShowIds(tagFilter: string[]): Promise<string[] | null> {
  const ids: string[] = [];
  const slugs: string[] = [];
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const t of tagFilter) {
    if (uuidRegex.test(t)) ids.push(t);
    else slugs.push(t.toLowerCase());
  }

  const tagIds = [...ids];
  if (slugs.length > 0) {
    const matchedTags = await db.select().from(tags).where(inArray(tags.slug, slugs));
    for (const mt of matchedTags) {
      if (mt.id) tagIds.push(String(mt.id));
    }
  }

  if (tagIds.length === 0) return null;

  const matched = await db
    .select({ showId: showTags.showId })
    .from(showTags)
    .where(inArray(showTags.tagId, tagIds));

  const showIds = Array.from(new Set(matched.map((m) => String(m.showId))));
  return showIds.length > 0 ? showIds : null;
}

/**
 * Get distinct months that have upcoming published performances.
 * Returns sorted array of "YYYY-MM" strings.
 */
export async function getUpcomingMonths(): Promise<string[]> {
  const now = new Date();
  const rows = await db
    .select({ date: performances.date })
    .from(performances)
    .where(and(gte(performances.date, now), eq(performances.status, 'published')));

  const months = new Set<string>();
  for (const row of rows) {
    const d = new Date(row.date);
    months.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return [...months].sort();
}

/**
 * Get all published shows with upcoming performances
 */
export async function getUpcomingShows(
  offset?: number,
  limit?: number,
  tagFilter?: string[],
  monthFilter?: string, // "YYYY-MM"
): Promise<ShowWithTagsAndPerformances[]> {
  const now = new Date();
  const nowUTC = new Date(now.toISOString());

  // Build base where conditions for published shows
  let whereConditions = and(
    eq(shows.status, 'published'),
    or(isNull(shows.publicationDate), lte(shows.publicationDate, nowUTC)),
    or(isNull(shows.depublicationDate), gte(shows.depublicationDate, nowUTC)),
  );

  // Apply tag filtering if provided
  if (tagFilter && tagFilter.length > 0) {
    const showIds = await resolveTagShowIds(tagFilter);
    if (!showIds) return [];
    whereConditions = and(whereConditions, inArray(shows.id, showIds));
  }

  // Build performance date filter — narrow to a specific month if requested
  let perfDateFilter;
  if (monthFilter) {
    const [year, month] = monthFilter.split('-').map(Number);
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1)); // first day of next month
    const effectiveStart = monthStart > nowUTC ? monthStart : nowUTC;
    perfDateFilter = and(gte(performances.date, effectiveStart), lt(performances.date, monthEnd));
  } else {
    perfDateFilter = gte(performances.date, nowUTC);
  }

  // Build the query with conditional limit and offset
  const queryConfig = {
    where: whereConditions,
    with: {
      image: true,
      performances: {
        where: and(perfDateFilter, eq(performances.status, 'published')),
        orderBy: [asc(performances.date)],
      },
      showTags: {
        with: { tag: true },
      },
    },
    orderBy: [asc(shows.title)],
    ...(offset && offset > 0 ? { offset } : {}),
    ...(limit && limit > 0 ? { limit } : {}),
  } as const;

  // Execute query
  const result = await db.query.shows.findMany(queryConfig as any);

  // Filter out shows with no upcoming performances and map tags
  return result
    .filter((show: any) => show.performances.length > 0)
    .map((show: any) => ({
      ...show,
      tags: show.showTags.map((st: any) => st.tag).filter(Boolean),
    })) as ShowWithTagsAndPerformances[];
}

/**
 * Count published shows that have at least one upcoming performance matching
 * the given filters.  Lightweight alternative to getUpcomingShows for pagination.
 */
export async function getUpcomingShowsCount(
  tagFilter?: string[],
  monthFilter?: string,
): Promise<number> {
  const now = new Date();
  const nowUTC = new Date(now.toISOString());

  let whereConditions = and(
    eq(shows.status, 'published'),
    or(isNull(shows.publicationDate), lte(shows.publicationDate, nowUTC)),
    or(isNull(shows.depublicationDate), gte(shows.depublicationDate, nowUTC)),
  );

  if (tagFilter && tagFilter.length > 0) {
    const showIds = await resolveTagShowIds(tagFilter);
    if (!showIds) return 0;
    whereConditions = and(whereConditions, inArray(shows.id, showIds));
  }

  // Build performance date filter
  let perfDateFilter;
  if (monthFilter) {
    const [year, month] = monthFilter.split('-').map(Number);
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1));
    const effectiveStart = monthStart > nowUTC ? monthStart : nowUTC;
    perfDateFilter = and(gte(performances.date, effectiveStart), lt(performances.date, monthEnd));
  } else {
    perfDateFilter = gte(performances.date, nowUTC);
  }

  const result = await db
    .select({ total: count() })
    .from(shows)
    .where(
      and(
        whereConditions,
        exists(
          db
            .select()
            .from(performances)
            .where(
              and(
                eq(performances.showId, shows.id),
                eq(performances.status, 'published'),
                perfDateFilter,
              ),
            ),
        ),
      ),
    );

  return result[0].total;
}

/**
 * Get recently passed shows (fallback when no upcoming shows exist)
 * Returns shows with past performances, ordered by most recent first
 */
export async function getRecentlyPassedShows(
  offset?: number,
  limit?: number,
): Promise<ShowWithTagsAndPerformances[]> {
  const now = new Date();
  const nowUTC = new Date(now.toISOString());

  const whereConditions = and(
    eq(shows.status, 'published'),
    or(isNull(shows.publicationDate), lte(shows.publicationDate, nowUTC)),
    or(isNull(shows.depublicationDate), gte(shows.depublicationDate, nowUTC)),
  );

  const queryConfig = {
    where: whereConditions,
    with: {
      image: true,
      performances: {
        where: and(lt(performances.date, nowUTC), eq(performances.status, 'published')),
        orderBy: [desc(performances.date)],
      },
      showTags: {
        with: { tag: true },
      },
    },
    orderBy: [desc(shows.title)],
    ...(offset && offset > 0 ? { offset } : {}),
    ...(limit && limit > 0 ? { limit } : {}),
  } as const;

  const result = await db.query.shows.findMany(queryConfig as any);

  return result
    .filter((show: any) => show.performances.length > 0)
    .map((show: any) => ({
      ...show,
      tags: show.showTags.map((st: any) => st.tag).filter(Boolean),
    })) as ShowWithTagsAndPerformances[];
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
