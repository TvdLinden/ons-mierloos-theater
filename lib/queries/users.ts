import { users } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { asc, eq, ilike, or } from 'drizzle-orm';

export type User = typeof users.$inferSelect;
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result[0] || null;
}

export async function getAllUsers(searchTerm?: string): Promise<User[]> {
  return await db
    .select()
    .from(users)
    .where(
      searchTerm
        ? or(ilike(users.name, `%${searchTerm}%`), ilike(users.email, `%${searchTerm}%`))
        : undefined,
    )
    .orderBy(asc(users.name));
}
