import { db } from '../db';
import { socialMediaLinks } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import type { SocialMediaLink } from '../db';

export async function getAllSocialMediaLinks(): Promise<SocialMediaLink[]> {
  return await db.select().from(socialMediaLinks).orderBy(socialMediaLinks.displayOrder);
}

export async function getActiveSocialMediaLinks(): Promise<SocialMediaLink[]> {
  return await db
    .select()
    .from(socialMediaLinks)
    .where(eq(socialMediaLinks.active, 1))
    .orderBy(socialMediaLinks.displayOrder);
}

export async function getSocialMediaLinkById(id: string): Promise<SocialMediaLink | null> {
  const results = await db.select().from(socialMediaLinks).where(eq(socialMediaLinks.id, id));
  return results.length > 0 ? results[0] : null;
}
