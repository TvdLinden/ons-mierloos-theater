'use server';

import { validateCredentials } from '@/lib/utils/auth';
import { updateUser } from '@/lib/commands/users';
import { redirect } from 'next/navigation';
import { User } from '@/lib/db';

export async function signinAction(prevState: { error?: string }, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectUrl = (formData.get('redirectUrl') as string) || '/';

  if (!email || !password) {
    return { error: 'E-mailadres en wachtwoord zijn verplicht.' };
  }

  // Use shared validation logic
  const result = await validateCredentials(email, password);

  if (result.success === false) {
    return { error: result.error || 'Er is een fout opgetreden bij het inloggen.' };
  }

  // Update last signin timestamp
  await updateUser(result.user.id, { lastSignin: new Date() });

  // Redirect after successful validation
  redirect(redirectUrl);
}
