'use server';

import { getShowBySlugWithTagsAndPerformances } from '@/lib/queries/shows';

export async function getShowBySlug(slug: string) {
  try {
    const show = await getShowBySlugWithTagsAndPerformances(slug);
    return show;
  } catch (error) {
    console.error('Error fetching show:', error);
    return null;
  }
}
