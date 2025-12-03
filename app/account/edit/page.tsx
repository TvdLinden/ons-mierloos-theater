'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Input, FormField, Alert } from '@/components/ui';
import Link from 'next/link';

export default function EditProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!session?.user) {
    router.push('/auth/signin?redirectUrl=/account/edit');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/account/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden');
      }

      if (data.emailChanged) {
        setSuccess(
          'Profiel bijgewerkt! We hebben een verificatie-e-mail naar je nieuwe e-mailadres gestuurd.',
        );
      } else {
        setSuccess('Profiel succesvol bijgewerkt!');
      }

      // Update session data
      await update({
        ...session,
        user: {
          ...session.user,
          name: data.user.name,
          email: data.user.email,
        },
      });

      setTimeout(() => {
        router.push('/account');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-6">
        <Link href="/account" className="text-primary hover:underline">
          ← Terug naar account
        </Link>
      </div>

      <div className="bg-surface rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-text-primary font-display">Profiel bewerken</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField label="Naam" htmlFor="name" required>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="E-mailadres" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Opslaan...' : 'Profiel opslaan'}
            </Button>
            <Link href="/account">
              <Button type="button" variant="secondary">
                Annuleren
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
