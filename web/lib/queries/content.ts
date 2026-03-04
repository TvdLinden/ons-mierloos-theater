import { cacheLife, cacheTag } from 'next/cache';
import {
  getNavigationLinks as _getNavigationLinks,
  getActiveNewsArticles as _getActiveNewsArticles,
  getHomepageContent as _getHomepageContent,
} from '@ons-mierloos-theater/shared/queries/content';

export async function getNavigationLinks(
  ...args: Parameters<typeof _getNavigationLinks>
): ReturnType<typeof _getNavigationLinks> {
  'use cache';
  cacheLife({ revalidate: 900, expire: 31536000 });
  cacheTag('navigation');
  return _getNavigationLinks(...args);
}

export async function getActiveNewsArticles(
  ...args: Parameters<typeof _getActiveNewsArticles>
): ReturnType<typeof _getActiveNewsArticles> {
  'use cache';
  cacheLife({ revalidate: 900, expire: 31536000 });
  cacheTag('news');
  return _getActiveNewsArticles(...args);
}

export async function getHomepageContent(
  ...args: Parameters<typeof _getHomepageContent>
): ReturnType<typeof _getHomepageContent> {
  'use cache';
  cacheLife({ revalidate: 900, expire: 31536000 });
  cacheTag('homepage');
  return _getHomepageContent(...args);
}
