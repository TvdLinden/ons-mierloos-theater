import type { ShowWithTagsAndPerformances } from '@ons-mierloos-theater/shared/db';

/**
 * Returns a cacheLife config that expires precisely when the next upcoming
 * performance date passes, so pages never serve stale show data after a show
 * moves from upcoming to past.
 *
 * Pass the already-fetched shows and the current time (captured before any
 * async work so it stays consistent within a single render).
 */
export function showCacheLife(shows: ShowWithTagsAndPerformances[], now: Date) {
  const nextMs = shows
    .flatMap((s) =>
      s.performances
        .filter((p) => ['published', 'sold_out'].includes(p.status) && new Date(p.date) > now)
        .map((p) => new Date(p.date).getTime()),
    )
    .sort((a, b) => a - b)[0];

  const revalidate = nextMs ? Math.max(60, Math.floor((nextMs - now.getTime()) / 1000)) : 3600; // no upcoming performances — recheck hourly

  return { revalidate, stale: revalidate, expire: revalidate + 300 };
}
