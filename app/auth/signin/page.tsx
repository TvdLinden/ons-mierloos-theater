'use client';
import { useActionState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Input, FormField, Alert, Card } from '@/components/ui';
import { signinAction } from './actions';

function SignInForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl') || '/';
  const [state, formAction, isPending] = useActionState(signinAction, {});

  return (
    <Card className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4 text-primary">Inloggen</h1>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirectUrl" value={redirectUrl} />
        {state.error && <Alert variant="error">{state.error}</Alert>}
        <FormField label="E-mailadres" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="E-mailadres"
            required
            disabled={isPending}
          />
        </FormField>
        <FormField label="Wachtwoord" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Wachtwoord"
            required
            disabled={isPending}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Bezig met inloggen...' : 'Inloggen'}
        </Button>
      </form>
      <div className="mt-4 text-center space-y-2">
        <a href="/auth/forgot-password" className="block text-sm text-primary hover:underline">
          Wachtwoord vergeten?
        </a>
        <a
          href={`/auth/signup?redirect=${encodeURIComponent(redirectUrl)}`}
          className="block text-primary hover:underline"
        >
          Nog geen account? Registreer
        </a>
      </div>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto mt-10 p-6">Laden...</div>}>
      <SignInForm />
    </Suspense>
  );
}
