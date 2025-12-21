/**
 * Get the URL for an image by its ID.
 * This utility is safe to use in both server and client components.
 */
export function getImageUrl(imageId: string): string {
  return `/api/images/${imageId}`;
}
