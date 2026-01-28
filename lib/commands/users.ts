import { users } from '@/lib/db/schema';
import { db, User } from '../db';
import { eq } from 'drizzle-orm';
import { filterDefinedFields } from '@/lib/utils/filterDefinedFields';

export async function addUser(user: Omit<User, 'id'>): Promise<void> {
  await db.insert(users).values(user);
}

export async function deleteUser(id: string): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

export async function updateUser(id: string, fields: Partial<User>): Promise<void> {
  const patch = filterDefinedFields(fields);
  await db.update(users).set(patch).where(eq(users.id, id));
}

export async function replaceUser(id: string, fields: Omit<User, 'id'>): Promise<void> {
  await db.update(users).set(fields).where(eq(users.id, id));
}

export async function resetUserPassword(id: string, passwordHash: string): Promise<void> {
  await db
    .update(users)
    .set({
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    })
    .where(eq(users.id, id));
}
