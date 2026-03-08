'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Input, Alert, SimpleFormField as FormField } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ChevronLeft, KeyRound } from 'lucide-react';

export default function ChangePasswordPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!session?.user) {
    router.push('/auth/signin?redirectUrl=/account/change-password');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('De nieuwe wachtwoorden komen niet overeen');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Het nieuwe wachtwoord moet minimaal 8 tekens bevatten');
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('Het nieuwe wachtwoord moet minimaal één hoofdletter bevatten');
      setLoading(false);
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('Het nieuwe wachtwoord moet minimaal één kleine letter bevatten');
      setLoading(false);
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('Het nieuwe wachtwoord moet minimaal één cijfer bevatten');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Er is een fout opgetreden');
      }

      setSuccess('Wachtwoord succesvol gewijzigd!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.push('/account');
      }, 1500);
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
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Terug naar account
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Wachtwoord wijzigen</h1>
          <p className="text-muted-foreground mt-1">Kies een sterk nieuw wachtwoord</p>
        </div>

        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex items-center justify-center size-7 rounded-lg bg-muted">
                <KeyRound className="size-4 text-muted-foreground" />
              </span>
              Wachtwoord
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormField label="Huidig wachtwoord" htmlFor="currentPassword" required>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Nieuw wachtwoord" htmlFor="newPassword" required>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Minimaal 8 tekens, met een hoofdletter, kleine letter en cijfer
                </p>
              </FormField>

              <FormField label="Bevestig nieuw wachtwoord" htmlFor="confirmPassword" required>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </FormField>

              {error && <Alert variant="destructive">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Opslaan...' : 'Wachtwoord wijzigen'}
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
