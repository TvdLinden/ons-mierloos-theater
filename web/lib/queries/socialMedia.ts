import { cacheLife, cacheTag } from 'next/cache';
import { getActiveSocialMediaLinks as _getActiveSocialMediaLinks } from '@ons-mierloos-theater/shared/queries/socialMedia';

export async function getActiveSocialMediaLinks(
  ...args: Parameters<typeof _getActiveSocialMediaLinks>
): ReturnType<typeof _getActiveSocialMediaLinks> {
  'use cache';
  cacheLife({ revalidate: 900, expire: 31536000 });
  cacheTag('social-media-links');
  return _getActiveSocialMediaLinks(...args);
}
