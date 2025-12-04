import { revalidatePath } from 'next/cache';

/**
 * Invalidates all relevant paths that depend on show data.
 * Call this after any show mutation (create, update, delete, etc).
 * @param showId The ID of the show that was changed. Optional - if not provided, invalidates all show-related paths.
 */
export function invalidateShowPaths(showId?: string) {
  // Admin pages
  revalidatePath('/admin/shows'); // Admin shows overview (if exists)
  revalidatePath('/admin/performances'); // Admin performances overview (shows are listed here)

  if (showId) {
    revalidatePath(`/admin/shows/${showId}`); // Show detail page
    revalidatePath(`/admin/shows/${showId}/edit`); // Show edit page
    revalidatePath(`/admin/performances/edit/${showId}`); // Performance management for this show
  } else {
    // If no specific show ID, revalidate all show-related admin pages
    revalidatePath('/admin/shows', 'layout');
    revalidatePath('/admin/performances', 'layout');
  }

  // Public pages
  revalidatePath('/'); // Homepage (displays upcoming shows)
  revalidatePath('/performances'); // Public performances listing

  if (showId) {
    revalidatePath(`/performances/${showId}`); // Show detail page (by slug - handled dynamically)
  }

  // Performance pages
  revalidatePath('/checkout'); // Checkout may display show info

  // Sponsors page (if shows are displayed there)
  revalidatePath('/sponsors');
}

/**
 * Invalidates paths for a specific show by slug.
 * @param slug The slug of the show that was changed.
 */
export function invalidateShowPathsBySlug(slug: string) {
  revalidatePath(`/performances/${slug}`);
  revalidatePath('/'); // Homepage
  revalidatePath('/performances'); // Public performances listing
}
