'use server';

import { redirect } from 'next/navigation';
import { signIn } from 'next-auth/react';

export async function signinAction(prevState: { error?: string }, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectUrl = (formData.get('redirectUrl') as string) || '/';

  if (!email || !password) {
    return { error: 'E-mailadres en wachtwoord zijn verplicht.' };
  }

  try {
    // Use NextAuth signIn on server side
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      return { error: 'Ongeldige inloggegevens.' };
    }

    // Redirect after successful sign in
    redirect(redirectUrl);
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: 'Er is een fout opgetreden. Probeer het opnieuw.' };
  }
}
