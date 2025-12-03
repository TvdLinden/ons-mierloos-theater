import { db } from '@/lib/db';
import { mailingListSubscribers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get all active mailing list subscribers
 */
export async function getAllActiveSubscribers() {
  return db
    .select()
    .from(mailingListSubscribers)
    .where(eq(mailingListSubscribers.isActive, 1))
    .orderBy(mailingListSubscribers.subscribedAt);
}

/**
 * Get count of active subscribers
 */
export async function getActiveSubscribersCount() {
  const subscribers = await getAllActiveSubscribers();
  return subscribers.length;
}
