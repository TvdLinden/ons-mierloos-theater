import { db, Page } from '../db';
import { pages } from '../db/schema';
import { eq } from 'drizzle-orm';
import { blocksArraySchema } from '../schemas/blocks';
import type { BlocksArray } from '../schemas/blocks';

export async function updatePage(id: string, fields: Partial<Page>): Promise<void> {
  await db.update(pages).set(fields).where(eq(pages.id, id));
}

export async function createPage(fields: Omit<Page, 'id'>): Promise<string> {
  const result = await db
    .insert(pages)
    .values(fields)
    .returning({ id: pages.id, slug: pages.slug as any });
  const inserted = result[0] as any;
  return inserted.id as string;
}

export async function getPageById(id: string): Promise<(Page & { blocks?: BlocksArray }) | null> {
  const result = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  const page = result[0];
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
