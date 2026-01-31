import { Image } from '@/lib/db';

/**
 * Get the URL for an image by ID or image object
 * Returns R2 URL if available, otherwise API endpoint for legacy bytea
 * This utility is safe to use in both server and client components.
 */
export function getImageUrl(
  imageIdOrImage: string | Pick<Image, 'r2Url' | 'id'>,
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
): string {
  // If it's an image object with R2 URL, return it directly
  if (typeof imageIdOrImage === 'object' && imageIdOrImage.r2Url) {
    return imageIdOrImage.r2Url;
  }

  // Extract ID from object or use string directly
  const imageId = typeof imageIdOrImage === 'string' ? imageIdOrImage : imageIdOrImage.id;

  // Fallback to API endpoint for legacy bytea storage
  if (size) {
    return `/api/images/${imageId}?size=${size}`;
  }
  return `/api/images/${imageId}`;
}
