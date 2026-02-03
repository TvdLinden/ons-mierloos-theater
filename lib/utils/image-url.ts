import { Image } from '@/lib/db';

/**
 * Get the URL for an image by ID or image object
 * Returns R2 URL if available, otherwise API endpoint for legacy bytea
 * This utility is safe to use in both server and client components.
 */
export function getImageUrl(imageId: string, size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): string {
  // Fallback to API endpoint for legacy bytea storage
  return `/api/images/${imageId}`;
}
