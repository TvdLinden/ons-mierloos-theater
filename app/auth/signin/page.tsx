'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button, Input, Alert, Card, SimpleFormField } from '@/components/ui';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirectUrl') || '/';
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      setError('E-mailadres en wachtwoord zijn verplicht.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Ongeldige inloggegevens.');
        setIsLoading(false);
      } else if (result?.ok) {
        // Redirect on successful signin
        router.push(redirectUrl);
      }
    } catch (err) {
      setError('Er is een fout opgetreden. Probeer het opnieuw.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4 text-primary">Inloggen</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="destructive">{error}</Alert>}
        <SimpleFormField label="E-mailadres" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="E-mailadres"
            required
            disabled={isLoading}
          />
        </SimpleFormField>
        <SimpleFormField label="Wachtwoord" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Wachtwoord"
            required
            disabled={isLoading}
          />
        </SimpleFormField>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Bezig met inloggen...' : 'Inloggen'}
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
