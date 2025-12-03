'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui';

type MailingListFormProps = {
  action: (
    prevState: { error?: string; success?: boolean },
    formData: FormData,
  ) => Promise<{ error?: string; success?: boolean }>;
  subscriberCount: number;
};

export default function MailingListForm({ action, subscriberCount }: MailingListFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    error: undefined,
    success: false,
  });

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <Alert variant="error">{state.error}</Alert>}
      {state.success && (
        <Alert variant="success">E-mail succesvol verzonden naar alle abonnees!</Alert>
      )}

      <div>
        <label htmlFor="subject" className="block text-sm font-semibold text-primary mb-2">
          Onderwerp *
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Bijv: Nieuwe voorstelling aangekondigd!"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-primary mb-2">
          Bericht *
        </label>
        <textarea
          id="message"
          name="message"
          rows={10}
          required
          className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Schrijf hier je bericht..."
        />
        <p className="text-xs text-zinc-600 mt-2">
          Dit bericht wordt verzonden naar alle {subscriberCount} actieve abonnees.
        </p>
      </div>

      <div className="pt-4 border-t border-zinc-200">
        <button
          type="submit"
          disabled={isPending}
          className="w-full px-6 py-3 bg-primary text-surface rounded-lg hover:bg-secondary font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Verzenden...' : `Verstuur naar ${subscriberCount} abonnees`}
        </button>
      </div>
    </form>
  );
}
