import { db } from '../db';
import { socialMediaLinks } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function createSocialMediaLink(data: {
  platform: string;
  url: string;
  displayOrder: number;
  active: number;
}) {
  const [link] = await db.insert(socialMediaLinks).values(data).returning();
  return link;
}

export async function updateSocialMediaLink(
  id: string,
  data: {
    platform?: string;
    url?: string;
    displayOrder?: number;
    active?: number;
  },
) {
  await db
    .update(socialMediaLinks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(socialMediaLinks.id, id));
}

export async function deleteSocialMediaLink(id: string) {
  await db.delete(socialMediaLinks).where(eq(socialMediaLinks.id, id));
}
