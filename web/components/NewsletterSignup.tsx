'use client';

import { useState } from 'react';
import { subscribeNewsletter } from '@/app/newsletter/actions';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<
    { type: 'success' | 'info'; message: string } | { type: 'error'; message: string } | null
  >(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    const response = await subscribeNewsletter(email);

    if ('error' in response) {
      setResult({ type: 'error', message: response.error });
    } else {
      setEmail('');
      setResult(
        response.alreadySubscribed
          ? { type: 'info', message: 'Dit e-mailadres is al aangemeld.' }
          : { type: 'success', message: 'Gelukt! Je bent aangemeld voor de nieuwsbrief.' },
      );
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-sm mx-auto">
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="je@email.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Bezig...' : 'Abonneren'}
        </button>
      </form>

      {result && (
        <p
          className={`mt-3 text-sm text-center ${
            result.type === 'success'
              ? 'text-green-700'
              : result.type === 'info'
                ? 'text-zinc-500'
                : 'text-red-600'
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
