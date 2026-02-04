'use client';

import { useActionState } from 'react';
import { forgotPasswordAction } from './actions';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, {});

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2 text-primary">Wachtwoord vergeten</h1>
        <p className="text-text-secondary text-sm">
          Voer je e-mailadres in en we sturen je een link om je wachtwoord opnieuw in te stellen.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {state.error && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">{state.error}</div>
        )}
        {state.success && (
          <div className="p-3 bg-green-100 text-green-800 rounded-lg text-sm">
            Als dit e-mailadres bekend is, sturen we een reset link.
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
            E-mailadres
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="jouw@email.nl"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50"
        >
          {isPending ? 'Bezig...' : 'Verstuur reset link'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <a href="/auth/signin" className="text-primary hover:underline">
          Terug naar inloggen
        </a>
      </div>
    </div>
  );
}
