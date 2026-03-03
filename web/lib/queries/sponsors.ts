import { cacheLife, cacheTag } from 'next/cache';
import { getActiveSponsors as _getActiveSponsors } from '@ons-mierloos-theater/shared/queries/sponsors';

export async function getActiveSponsors(
  ...args: Parameters<typeof _getActiveSponsors>
): ReturnType<typeof _getActiveSponsors> {
  'use cache';
  cacheLife({ revalidate: 900, expire: 31536000 });
  cacheTag('sponsors');
  return _getActiveSponsors(...args);
}
