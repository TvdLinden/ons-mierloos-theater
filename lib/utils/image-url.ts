/**
 * Get the URL for an image by its ID.
 * This utility is safe to use in both server and client components.
 */
export function getImageUrl(imageId: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
  return `/api/images/${imageId}?size=${size}`;
}
