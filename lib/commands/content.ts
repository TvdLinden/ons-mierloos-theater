import { db } from '@/lib/db';
import { navigationLinks, homepageContent, newsArticles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { NavigationLink, HomepageContent, NewsArticle, LinkLocation } from '@/lib/db';

/**
 * Create navigation link
 */
export async function createNavigationLink(data: {
  label: string;
  href: string;
  location: LinkLocation;
  displayOrder?: number;
  active?: number;
}): Promise<NavigationLink> {
  const [link] = await db
    .insert(navigationLinks)
    .values({
      ...data,
      displayOrder: data.displayOrder ?? 0,
      active: data.active ?? 1,
    })
    .returning();
  return link;
}

/**
 * Update navigation link
 */
export async function updateNavigationLink(
  id: string,
  data: Partial<NavigationLink>,
): Promise<void> {
  await db.update(navigationLinks).set(data).where(eq(navigationLinks.id, id));
}

/**
 * Delete navigation link
 */
export async function deleteNavigationLink(id: string): Promise<void> {
  await db.delete(navigationLinks).where(eq(navigationLinks.id, id));
}

/**
 * Update or create homepage content
 */
export async function upsertHomepageContent(data: {
  introTitle?: string;
  introText?: string;
}): Promise<void> {
  const existing = await db.select().from(homepageContent).limit(1);

  if (existing.length > 0) {
    await db
      .update(homepageContent)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(homepageContent.id, existing[0].id));
  } else {
    await db.insert(homepageContent).values({ ...data, updatedAt: new Date() });
  }
}

/**
 * Create news article
 */
export async function createNewsArticle(data: {
  title: string;
  content: string;
  imageId?: string;
  publishedAt?: Date;
  active?: number;
  displayOrder?: number;
}): Promise<NewsArticle> {
  const [article] = await db
    .insert(newsArticles)
    .values({
      ...data,
      active: data.active ?? 1,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();
  return article;
}

/**
 * Update news article
 */
export async function updateNewsArticle(id: string, data: Partial<NewsArticle>): Promise<void> {
  await db
    .update(newsArticles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(newsArticles.id, id));
}

/**
 * Delete news article
 */
export async function deleteNewsArticle(id: string): Promise<void> {
  await db.delete(newsArticles).where(eq(newsArticles.id, id));
}
