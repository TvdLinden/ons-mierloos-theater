'use server';

import { updateSiteSettings, updateSeoSettings } from '@ons-mierloos-theater/shared/queries/settings';
import { requireRole } from '@/lib/utils/auth';
import { revalidatePath } from 'next/cache';

export async function updateSiteSettingsAction(data: {
  siteName: string;
  siteDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  logoImageId?: string | null;
  faviconImageId?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
}) {
  await requireRole(['admin']);

  try {
    await updateSiteSettings(data);
    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');
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
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    return { success: false, error: 'Failed to update SEO settings' };
  }
}
