import { db, Page } from '@/lib/db';
import { pages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updatePage(id: string, fields: Partial<Page>): Promise<void> {
  await db.update(pages).set(fields).where(eq(pages.id, id));
  // Attempt to fetch the updated page to revalidate its public route
  const result = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  const page = result[0];
  if (page) {
    try {
      revalidatePath(`/${page.slug}`);
      revalidatePath('/');
    } catch (err) {
      // ignore revalidation errors in library code
    }
  }
}

export async function createPage(fields: Omit<Page, 'id'>): Promise<string> {
  const result = await db
    .insert(pages)
    .values(fields)
    .returning({ id: pages.id, slug: pages.slug as any });
  const inserted = result[0] as any;
  // Revalidate home and the new page route if slug available
  try {
    if (inserted.slug) revalidatePath(`/${inserted.slug}`);
    revalidatePath('/');
  } catch (err) {
    // ignore
  }
  return inserted.id as string;
}

export async function getPageById(id: string): Promise<Page | null> {
  const result = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  return result[0] || null;
}
