import { db } from '@/lib/db';

export async function getAllSponsors() {
  return await db.query.sponsors.findMany({
    with: {
      logo: true,
    },
    orderBy: (sponsors, { asc }) => [asc(sponsors.displayOrder), asc(sponsors.name)],
  });
}

export async function getActiveSponsors() {
  return await db.query.sponsors.findMany({
    where: (sponsors, { eq }) => eq(sponsors.active, 1),
    with: {
      logo: true,
    },
    orderBy: (sponsors, { asc }) => [asc(sponsors.displayOrder), asc(sponsors.name)],
  });
}

export async function getSponsorById(id: string) {
  return await db.query.sponsors.findFirst({
    where: (sponsors, { eq }) => eq(sponsors.id, id),
    with: {
      logo: true,
    },
  });
}

export async function getSponsorsByTier(tier: 'gold' | 'silver' | 'bronze') {
  return await db.query.sponsors.findMany({
    where: (sponsors, { eq, and }) => and(eq(sponsors.tier, tier), eq(sponsors.active, 1)),
    with: {
      logo: true,
    },
    orderBy: (sponsors, { asc }) => [asc(sponsors.displayOrder), asc(sponsors.name)],
  });
}
