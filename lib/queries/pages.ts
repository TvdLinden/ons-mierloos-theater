import { eq, desc, and } from 'drizzle-orm';
import { db, Page } from '../db';
import { pages } from '../db/schema';

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.status, 'published')),
  });

  return page;
}

export async function getPageById(id: string): Promise<Page | null> {
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, id),
  });

  return page;
}

export async function getAllPages(): Promise<Page[]> {
  const result = await db.query.pages.findMany({
    orderBy: (page) => [desc(page.createdAt)],
  });
  return result;
}
