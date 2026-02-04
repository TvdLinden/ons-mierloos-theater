import { db } from '../db';
import { sponsors } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function createSponsor(data: {
  name: string;
  logoId: string | null;
  website: string | null;
  tier: 'gold' | 'silver' | 'bronze';
  displayOrder: number;
  active: number;
}) {
  const [sponsor] = await db
    .insert(sponsors)
    .values({
      name: data.name,
      logoId: data.logoId,
      website: data.website,
      tier: data.tier,
      displayOrder: data.displayOrder,
      active: data.active,
    })
    .returning();

  return sponsor;
}

export async function updateSponsor(
  id: string,
  data: {
    name?: string;
    logoId?: string | null;
    website?: string | null;
    tier?: 'gold' | 'silver' | 'bronze';
    displayOrder?: number;
    active?: number;
  },
) {
  const [sponsor] = await db.update(sponsors).set(data).where(eq(sponsors.id, id)).returning();
  return sponsor;
}

export async function deleteSponsor(id: string) {
  await db.delete(sponsors).where(eq(sponsors.id, id));
}
