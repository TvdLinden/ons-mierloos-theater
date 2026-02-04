'use server';

import {
  createNavigationLink,
  updateNavigationLink,
  deleteNavigationLink,
  upsertHomepageContent,
  createNewsArticle,
  updateNewsArticle,
  deleteNewsArticle,
} from '@ons-mierloos-theater/shared/commands/content';
import {
  createSocialMediaLink,
  updateSocialMediaLink,
  deleteSocialMediaLink,
} from '@ons-mierloos-theater/shared/commands/socialMedia';
import { updatePage, createPage } from '@ons-mierloos-theater/shared/commands/pages';
import { revalidatePath, revalidateTag } from 'next/cache';
import type { LinkLocation, NewsArticle, SocialMediaLink, Page } from '@ons-mierloos-theater/shared/db';

export async function createNavigationLinkAction(data: {
  label: string;
  href: string;
  location: LinkLocation;
  displayOrder: number;
  active: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await createNavigationLink(data);
    revalidatePath('/admin/content');
    revalidateTag('navigation', 'default');
    return { success: true };
  } catch (error) {
    console.error('Error creating navigation link:', error);
    return { success: false, error: 'Fout bij het toevoegen van de link' };
  }
}

export async function updateNavigationLinkAction(
  id: string,
  data: {
    label?: string;
    href?: string;
    displayOrder?: number;
    active?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateNavigationLink(id, data);
    revalidatePath('/admin/content');
    revalidateTag('navigation', 'default');
    return { success: true };
  } catch (error) {
    console.error('Error updating navigation link:', error);
    return { success: false, error: 'Fout bij het bijwerken van de link' };
  }
}

export async function deleteNavigationLinkAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteNavigationLink(id);
    revalidatePath('/admin/content');
    revalidateTag('navigation', 'default');
    return { success: true };
  } catch (error) {
    console.error('Error deleting navigation link:', error);
    return { success: false, error: 'Fout bij het verwijderen van de link' };
  }
}

export async function updateHomepageContentAction(data: {
  introTitle?: string;
  introText?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    await upsertHomepageContent(data);
    revalidatePath('/admin/content');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating homepage content:', error);
    return { error: 'Fout bij het bijwerken van de homepage inhoud' };
  }
}

// News Articles Actions
export async function createNewsArticleAction(data: {
  title: string;
  content: string;
  publishedAt?: Date;
  active?: number;
  imageId?: string | null;
}): Promise<{ success: boolean; article?: NewsArticle; error?: string }> {
  try {
    const article = await createNewsArticle(data);
    revalidatePath('/admin/content');
    revalidatePath('/');
    return { success: true, article };
  } catch (error) {
    console.error('Error creating news article:', error);
    return { success: false, error: 'Fout bij het toevoegen van het artikel' };
  }
}

export async function updateNewsArticleAction(
  id: string,
  data: {
    title?: string;
    content?: string;
    publishedAt?: Date;
    active?: number;
    imageId?: string | null;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateNewsArticle(id, data);
    revalidatePath('/admin/content');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating news article:', error);
    return { success: false, error: 'Fout bij het bijwerken van het artikel' };
  }
}

export async function deleteNewsArticleAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteNewsArticle(id);
    revalidatePath('/admin/content');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error deleting news article:', error);
    return { success: false, error: 'Fout bij het verwijderen van het artikel' };
  }
}

export async function toggleNewsArticleActiveAction(
  id: string,
  active: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateNewsArticle(id, { active });
    revalidatePath('/admin/content');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error toggling article active status:', error);
    return { success: false, error: 'Fout bij het wijzigen van de status' };
  }
}

// Social Media Links Actions
export async function createSocialMediaLinkAction(data: {
  platform: string;
  url: string;
  displayOrder: number;
  active: number;
}): Promise<{ success: boolean; link?: SocialMediaLink; error?: string }> {
  try {
    const link = await createSocialMediaLink(data);
    revalidatePath('/admin/content');
    revalidateTag('social-media-links', 'default');
    return { success: true, link };
  } catch (error) {
    console.error('Error creating social media link:', error);
    return { success: false, error: 'Fout bij het toevoegen van de link' };
  }
}

export async function updateSocialMediaLinkAction(
  id: string,
  data: {
    platform?: string;
    url?: string;
    displayOrder?: number;
    active?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateSocialMediaLink(id, data);
    revalidatePath('/admin/content');
    revalidateTag('social-media-links', 'default');
    return { success: true };
  } catch (error) {
    console.error('Error updating social media link:', error);
    return { success: false, error: 'Fout bij het bijwerken van de link' };
  }
}

export async function deleteSocialMediaLinkAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteSocialMediaLink(id);
    revalidatePath('/admin/content');
    revalidateTag('social-media-links', 'default');
    return { success: true };
  } catch (error) {
    console.error('Error deleting social media link:', error);
    return { success: false, error: 'Fout bij het verwijderen van de link' };
  }
}

export async function toggleSocialMediaLinkActiveAction(
  id: string,
  active: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await updateSocialMediaLink(id, { active });
    revalidatePath('/admin/content');
    revalidateTag('social-media-links', 'default');
    return { success: true };
  } catch (error) {
    console.error('Error toggling link active status:', error);
    return { success: false, error: 'Fout bij het wijzigen van de status' };
  }
}

export async function updatePageAction(
  id: string,
  fields: Partial<Page>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await updatePage(id, fields);
    revalidatePath('/admin/content');
    if (fields.slug) {
      revalidatePath(`/${fields.slug}`);
    }
    revalidatePath('/');
    revalidateTag('pages', 'default');
    return { success: true };
  } catch (error) {
    console.error('Error updating page:', error);
    return { success: false, error: 'Fout bij het bijwerken van de pagina' };
  }
}

export async function createPageAction(
  fields: Omit<Page, 'id'>,
): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    const pageId = await createPage(fields);
    revalidatePath('/admin/content');
    if (fields.slug) {
      revalidatePath(`/${fields.slug}`);
    }
    revalidatePath('/');
    revalidateTag('pages', 'default');
    return { success: true, pageId };
  } catch (error) {
    console.error('Error creating page:', error);
    return { success: false, error: 'Fout bij het aanmaken van de pagina' };
  }
}
