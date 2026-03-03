'use server';

import {
  updateSiteSettings,
  updateSeoSettings,
  createCustomCodeSnippet,
  updateCustomCodeSnippet,
  deleteCustomCodeSnippet,
} from '@ons-mierloos-theater/shared/queries/settings';
import { requireRole } from '@/lib/utils/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { SITE_SETTINGS_TAG } from '@/lib/queries/cachedSettings';

export async function updateSiteSettingsAction(data: {
  siteName: string;
  siteDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  logoImageId?: string | null;
  fontDisplay?: string | null;
  fontBody?: string | null;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}) {
  await requireRole(['admin']);

  try {
    await updateSiteSettings(data);
    revalidatePath('/admin/settings');
    revalidateTag(SITE_SETTINGS_TAG);
    return { success: true };
  } catch (error) {
    console.error('Error updating site settings:', error);
    return { success: false, error: 'Failed to update site settings' };
  }
}

export async function updateSeoSettingsAction(data: {
  defaultTitle: string;
  defaultDescription?: string;
  defaultKeywords?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterSite?: string;
}) {
  await requireRole(['admin']);

  try {
    await updateSeoSettings(data);
    revalidatePath('/admin/settings');
    revalidateTag(SITE_SETTINGS_TAG);
    return { success: true };
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    return { success: false, error: 'Failed to update SEO settings' };
  }
}

export async function createSnippetAction(data: {
  name: string;
  location: string;
  html: string;
  isEnabled?: boolean;
  sortOrder?: number;
}) {
  await requireRole(['admin']);

  try {
    const snippet = await createCustomCodeSnippet(data);
    revalidatePath('/admin/settings');
    revalidateTag(SITE_SETTINGS_TAG);
    return { success: true, snippet };
  } catch (error) {
    console.error('Error creating snippet:', error);
    return { success: false, error: 'Kon het snippet niet aanmaken' };
  }
}

export async function updateSnippetAction(
  id: string,
  data: {
    name?: string;
    location?: string;
    html?: string;
    isEnabled?: boolean;
    sortOrder?: number;
  },
) {
  await requireRole(['admin']);

  try {
    const snippet = await updateCustomCodeSnippet(id, data);
    revalidatePath('/admin/settings');
    revalidateTag(SITE_SETTINGS_TAG);
    return { success: true, snippet };
  } catch (error) {
    console.error('Error updating snippet:', error);
    return { success: false, error: 'Kon het snippet niet bijwerken' };
  }
}

export async function deleteSnippetAction(id: string) {
  await requireRole(['admin']);

  try {
    await deleteCustomCodeSnippet(id);
    revalidatePath('/admin/settings');
    revalidateTag(SITE_SETTINGS_TAG);
    return { success: true };
  } catch (error) {
    console.error('Error deleting snippet:', error);
    return { success: false, error: 'Kon het snippet niet verwijderen' };
  }
}
