import { db } from '@/lib/db';
import { navigationLinks, homepageContent, newsArticles } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { NavigationLink, LinkLocation, HomepageContent, NewsArticle } from '@/lib/db';

/**
 * Get all navigation links for a specific location
 */
export async function getNavigationLinks(location: LinkLocation): Promise<NavigationLink[]> {
  return await db
    .select()
    .from(navigationLinks)
    .where(and(eq(navigationLinks.location, location), eq(navigationLinks.active, 1)))
    .orderBy(navigationLinks.displayOrder);
}

/**
 * Get all navigation links (admin)
 */
export async function getAllNavigationLinks(): Promise<NavigationLink[]> {
  return await db
    .select()
    .from(navigationLinks)
    .orderBy(navigationLinks.location, navigationLinks.displayOrder);
}

/**
 * Get homepage content
 */
export async function getHomepageContent(): Promise<HomepageContent | null> {
  const result = await db.select().from(homepageContent).limit(1);
  return result[0] || null;
}

/**
 * Get active news articles
 */
export async function getActiveNewsArticles(limit = 10): Promise<NewsArticle[]> {
  return await db
    .select()
    .from(newsArticles)
    .where(eq(newsArticles.active, 1))
    .orderBy(desc(newsArticles.publishedAt), newsArticles.displayOrder)
    .limit(limit);
}

/**
 * Get all news articles (admin)
 */
export async function getAllNewsArticles(): Promise<NewsArticle[]> {
  return await db.select().from(newsArticles).orderBy(desc(newsArticles.createdAt));
}

/**
 * Get news article by ID
 */
export async function getNewsArticleById(id: string): Promise<NewsArticle | null> {
  const result = await db.select().from(newsArticles).where(eq(newsArticles.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Get navigation link by ID
 */
export async function getNavigationLinkById(id: string): Promise<NavigationLink | null> {
  const result = await db.select().from(navigationLinks).where(eq(navigationLinks.id, id)).limit(1);
  return result[0] || null;
}
