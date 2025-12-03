import { Show } from '@/lib/db';

/**
 * Get the image URL for a performance's main image
 */
export function getShowImageUrl(performance: Show): string {
  if (performance.imageId) {
    return `/api/images/${performance.imageId}`;
  }
  // Fallback placeholder image
  return '/placeholder-performance.svg';
}

/**
 * Get the thumbnail image URL for a performance
 */
export function getShowThumbnailUrl(performance: Show): string {
  if (performance.thumbnailImageId) {
    return `/api/images/${performance.thumbnailImageId}`;
  }
  // Fall back to main image if no thumbnail
  if (performance.imageId) {
    return `/api/images/${performance.imageId}`;
  }
  return '/placeholder-performance.svg';
}
