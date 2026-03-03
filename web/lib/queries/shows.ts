import { cacheLife, cacheTag } from 'next/cache';
import {
  getUpcomingShows as _getUpcomingShows,
  getRecentlyPassedShows as _getRecentlyPassedShows,
} from '@ons-mierloos-theater/shared/queries/shows';

export async function getUpcomingShows(
  ...args: Parameters<typeof _getUpcomingShows>
): ReturnType<typeof _getUpcomingShows> {
  'use cache';
  cacheLife({ revalidate: 900, expire: 31536000 });
  cacheTag('shows');
  return _getUpcomingShows(...args);
}

export async function getRecentlyPassedShows(
  ...args: Parameters<typeof _getRecentlyPassedShows>
): ReturnType<typeof _getRecentlyPassedShows> {
  'use cache';
  cacheLife({ revalidate: 900, expire: 31536000 });
  cacheTag('shows');
  return _getRecentlyPassedShows(...args);
}
