'use client';

import { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement newsletter signup API call
      console.log('Newsletter signup:', email);
      setEmail('');
    } catch (error) {
      console.error('Error signing up:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="max-w-sm mx-auto flex gap-2" onSubmit={handleSubmit}>
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
  );
}
