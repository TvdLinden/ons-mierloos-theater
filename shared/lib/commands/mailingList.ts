import { db, MailingListSubscriber } from '../db';
import { mailingListSubscribers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function subscribeToMailingList(
  email: string,
  name?: string,
): Promise<MailingListSubscriber> {
  // Check if email already exists
  const existing = await db
    .select()
    .from(mailingListSubscribers)
    .where(eq(mailingListSubscribers.email, email))
    .limit(1);

  if (existing.length > 0) {
    const subscriber = existing[0];
    // If already subscribed and active, return it
    if (subscriber.isActive === 1) {
      return subscriber;
    }
    // If unsubscribed, reactivate
    const updated = await db
      .update(mailingListSubscribers)
      .set({
        isActive: 1,
        unsubscribeToken: subscriber.unsubscribeToken || randomUUID(),
        unsubscribedAt: null,
        subscribedAt: new Date(),
        name: name || subscriber.name,
      })
      .where(eq(mailingListSubscribers.id, subscriber.id))
      .returning();
    return updated[0];
  }

  // Create new subscriber
  const result = await db
    .insert(mailingListSubscribers)
    .values({
      email,
      name: name || null,
      isActive: 1,
      unsubscribeToken: randomUUID(),
    })
    .returning();

  return result[0];
}

export async function unsubscribeFromMailingList(email: string): Promise<void> {
  await db
    .update(mailingListSubscribers)
    .set({
      isActive: 0,
      unsubscribedAt: new Date(),
    })
    .where(eq(mailingListSubscribers.email, email));
}

export async function getSubscriberByToken(token: string): Promise<MailingListSubscriber | null> {
  const rows = await db
    .select()
    .from(mailingListSubscribers)
    .where(eq(mailingListSubscribers.unsubscribeToken, token))
    .limit(1);
  return rows.length ? rows[0] : null;
}

export async function unsubscribeByToken(token: string): Promise<void> {
  await db
    .update(mailingListSubscribers)
    .set({ isActive: 0, unsubscribedAt: new Date() })
    .where(eq(mailingListSubscribers.unsubscribeToken, token));
}

export async function getSubscriberByEmail(email: string): Promise<MailingListSubscriber | null> {
  const rows = await db
    .select()
    .from(mailingListSubscribers)
    .where(eq(mailingListSubscribers.email, email))
    .limit(1);
  return rows.length ? rows[0] : null;
}

export async function getAllActiveSubscribers(): Promise<MailingListSubscriber[]> {
  return db
    .select()
    .from(mailingListSubscribers)
    .where(eq(mailingListSubscribers.isActive, 1))
    .orderBy(mailingListSubscribers.subscribedAt);
}
