'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Input, Alert, SimpleFormField as FormField } from '@/components/ui';
import Link from 'next/link';

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

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('De nieuwe wachtwoorden komen niet overeen');
      setLoading(false);
      return;
    }

    // Validate password strength
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
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-6">
        <Link href="/account" className="text-primary hover:underline">
          ← Terug naar account
        </Link>
      </div>

      <div className="bg-surface rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-text-primary font-display">
          Wachtwoord wijzigen
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <p className="text-sm text-text-secondary mt-1">
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

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Opslaan...' : 'Wachtwoord wijzigen'}
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
