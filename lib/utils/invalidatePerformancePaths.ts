import { revalidatePath } from 'next/cache';

/**
 * Invalidates all relevant paths that depend on performance data.
 * Call this after any performance mutation (update, publish, delete, etc).
 * @param performanceId The ID of the performance that was changed.
 */
export function invalidatePerformancePaths(performanceId: string) {
  revalidatePath('/admin/performances'); // Admin overview
  revalidatePath('/performances'); // Public listing
  revalidatePath(`/performances/${performanceId}`); // Performance detail page
  revalidatePath('/'); // Homepage

  // Add more paths here if needed
}
