import { unstable_cache } from 'next/cache';
import {
  getSiteSettings,
  getEnabledSnippetsByLocation,
} from '@ons-mierloos-theater/shared/queries/settings';

export const SITE_SETTINGS_TAG = 'site-settings';

/**
 * Cached version of getSiteSettings.
 * Cached indefinitely — busted by revalidateTag(SITE_SETTINGS_TAG).
 */
export const getCachedSiteSettings = unstable_cache(getSiteSettings, ['site-settings'], {
  tags: [SITE_SETTINGS_TAG],
});

/**
 * Cached version of getEnabledSnippetsByLocation.
 * Next.js includes function arguments in the cache key automatically,
 * so 'head', 'body_start' and 'body_end' get separate entries.
 */
export const getCachedEnabledSnippetsByLocation = unstable_cache(
  (location: string) => getEnabledSnippetsByLocation(location),
  ['snippets-by-location'],
  { tags: [SITE_SETTINGS_TAG] },
);
