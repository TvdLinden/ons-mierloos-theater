import { eq, desc, and } from 'drizzle-orm';
import { db, Page } from '../db';
import { pages } from '../db/schema';
import { blocksArraySchema } from '../schemas/blocks';
import type { BlocksArray } from '../schemas/blocks';

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const page = await db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.status, 'published')),
  });

  return page;
}

export async function getPageById(id: string): Promise<(Page & { blocks?: BlocksArray }) | null> {
  const page = await db.query.pages.findFirst({
    where: eq(pages.id, id),
  });

  if (!page) return null;

  // Parse and validate blocks
  const blocks = page.blocks
    ? (() => {
        try {
          const parsed = JSON.parse(JSON.stringify(page.blocks));
          return blocksArraySchema.parse(parsed);
        } catch {
          return undefined;
        }
      })()
    : undefined;

  return { ...page, blocks };
}

export async function getAllPages(): Promise<Page[]> {
  const result = await db.query.pages.findMany({
    orderBy: (page) => [desc(page.createdAt)],
  });
  return result;
}
