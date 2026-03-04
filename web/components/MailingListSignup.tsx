'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MailingListSignup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/mailing-list/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Bedankt voor je inschrijving!');
        setEmail('');
        setName('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Er is iets misgegaan. Probeer het opnieuw.');
      }
    } catch {
      setStatus('error');
      setMessage('Er is iets misgegaan. Probeer het opnieuw.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-component="mailing-list-form">
      <div className="space-y-2" data-field="name-field">
        <Label
          htmlFor="mailing-name"
          className="text-accent-foreground font-medium"
          data-element="field-label"
        >
          Naam (optioneel)
        </Label>
        <Input
          id="mailing-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Je naam"
          disabled={status === 'loading'}
          className="!bg-accent-foreground/20 !border-accent-foreground/50 !text-accent-foreground !placeholder:text-accent-foreground/70 focus-visible:!border-primary focus-visible:!ring-primary/50"
          data-element="form-input"
        />
      </div>
      <div className="space-y-2" data-field="email-field">
        <Label
          htmlFor="mailing-email"
          className="text-accent-foreground font-medium"
          data-element="field-label"
        >
          E-mailadres *
        </Label>
        <Input
          id="mailing-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="je@email.nl"
          required
          disabled={status === 'loading'}
          className="!bg-accent-foreground/20 !border-accent-foreground/50 !text-accent-foreground !placeholder:text-accent-foreground/70 focus-visible:!border-primary focus-visible:!ring-primary/50"
          data-element="form-input"
        />
      </div>
      <Button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        data-element="submit-button"
      >
        {status === 'loading' ? 'Bezig...' : 'Inschrijven'}
      </Button>
      {message && (
        <Alert
          variant={status === 'success' ? 'success' : 'destructive'}
          data-element="form-message"
        >
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
