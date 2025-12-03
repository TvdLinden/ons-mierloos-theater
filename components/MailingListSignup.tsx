'use client';

import { useState } from 'react';

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
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <h3 className="text-2xl font-bold mb-4 text-primary">Nieuwsbrief</h3>
      <p className="text-textSecondary mb-4">
        Blijf op de hoogte van nieuwe voorstellingen en speciale aanbiedingen.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="mailing-name" className="block text-sm font-medium mb-1">
            Naam (optioneel)
          </label>
          <input
            id="mailing-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Je naam"
            disabled={status === 'loading'}
            className="w-full px-4 py-2 border border-secondary rounded focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
        </div>
        <div>
          <label htmlFor="mailing-email" className="block text-sm font-medium mb-1">
            E-mailadres *
          </label>
          <input
            id="mailing-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="je@email.nl"
            required
            disabled={status === 'loading'}
            className="w-full px-4 py-2 border border-secondary rounded focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full px-6 py-3 bg-accent text-surface rounded font-semibold hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Bezig...' : 'Inschrijven'}
        </button>
        {message && (
          <div
            className={`p-3 rounded ${
              status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
