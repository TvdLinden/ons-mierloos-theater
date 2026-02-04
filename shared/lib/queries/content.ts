import { db } from '../db';
import { navigationLinks, homepageContent, newsArticles } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { NavigationLink, LinkLocation, HomepageContent, NewsArticle } from '../db';

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
 * Get active news articles with image relations
 */
export async function getActiveNewsArticles(limit = 10) {
  return await db.query.newsArticles.findMany({
    where: eq(newsArticles.active, 1),
    with: {
      image: true,
    },
    orderBy: [desc(newsArticles.publishedAt), newsArticles.displayOrder],
    limit,
  });
}

/**
 * Get all news articles with image relations (admin)
 */
export async function getAllNewsArticles() {
  return await db.query.newsArticles.findMany({
    with: {
      image: true,
    },
    orderBy: [desc(newsArticles.createdAt)],
  });
}

/**
 * Get news article by ID with image relation
 */
export async function getNewsArticleById(id: string) {
  return await db.query.newsArticles.findFirst({
    where: eq(newsArticles.id, id),
    with: {
      image: true,
    },
  });
}

/**
 * Get navigation link by ID
 */
export async function getNavigationLinkById(id: string): Promise<NavigationLink | null> {
  const result = await db.select().from(navigationLinks).where(eq(navigationLinks.id, id)).limit(1);
  return result[0] || null;
}
