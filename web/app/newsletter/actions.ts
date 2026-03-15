'use server';

import { subscribeToMailingList } from '@ons-mierloos-theater/shared/commands/mailingList';

export type SubscribeResult =
  | { success: true; alreadySubscribed: boolean }
  | { success: false; error: string };

export async function subscribeNewsletter(email: string): Promise<SubscribeResult> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Ongeldig e-mailadres.' };
  }

  try {
    const subscriber = await subscribeToMailingList(email);
    const alreadySubscribed = new Date(subscriber.subscribedAt).getTime() < Date.now() - 5000;
    return { success: true, alreadySubscribed };
  } catch (error) {
    console.error('Newsletter signup error:', error);
    return { success: false, error: 'Er ging iets mis. Probeer het later opnieuw.' };
  }
}
