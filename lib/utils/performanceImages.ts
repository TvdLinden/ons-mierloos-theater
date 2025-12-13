import { Show } from '@/lib/db';

/**
 * Get the image URL for a performance's main image
 * @param show - Show record
 * @param size - Desired variant size (defaults to 'lg')
 */
export function getShowImageUrl(show: Show, size: 'lg' | 'md' | 'sm' = 'lg'): string {
  if (show.imageId) {
    return `/api/images/${show.imageId}?size=${size}`;
  }
  // Fallback placeholder image
  return '/placeholder-performance.svg';
}

/**
 * Get the thumbnail image URL for a performance
 * Uses the small variant for optimal thumbnail loading
 */
export function getShowThumbnailUrl(show: Show): string {
  if (show.imageId) {
    return `/api/images/${show.imageId}?size=sm`;
  }
  return '/placeholder-performance.svg';
}
