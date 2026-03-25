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
    <div>
      <form className="flex" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="je@email.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-3 bg-white border border-border text-foreground placeholder:text-muted-foreground focus:outline-none"
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="px-6 py-3 text-white font-bold tracking-widest uppercase text-sm transition-[filter] hover:brightness-110 disabled:opacity-50"
          style={{ fontFamily: 'var(--font-display)', backgroundColor: 'var(--color-maroon)' }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Bezig...' : 'Aanmelden'}
        </button>
      </form>

      {result && (
        <p
          className={`mt-3 text-sm ${
            result.type === 'success'
              ? 'text-foreground'
              : result.type === 'info'
                ? 'text-foreground/60'
                : 'text-red-700'
          }`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}
