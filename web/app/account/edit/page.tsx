'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Input, SimpleFormField as FormField, Alert } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ChevronLeft, User } from 'lucide-react';

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
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link href="/account">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Terug naar account
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Profiel bewerken</h1>
          <p className="text-muted-foreground mt-1">Pas je naam en e-mailadres aan</p>
        </div>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex items-center justify-center size-7 rounded-lg bg-muted">
                <User className="size-4 text-muted-foreground" />
              </span>
              Gegevens
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
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

              {error && <Alert variant="destructive">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Opslaan...' : 'Opslaan'}
                </Button>
                <Link href="/account">
                  <Button type="button" variant="outline">
                    Annuleren
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
