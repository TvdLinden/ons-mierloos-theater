'use client';

import { useActionState } from 'react';
import FormError from '@/components/FormError';

type SignupFormProps = {
  action: (formData: FormData) => Promise<{ error: string } | void>;
};

type SignupState = {
  error?: string;
} | null;

export default function SignupForm({ action }: SignupFormProps) {
  const [state, formAction] = useActionState<SignupState, FormData>(
    async (_prevState: SignupState, formData: FormData) => {
      return (await action(formData)) || null;
    },
    null,
  );

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-primary">Registreren</h1>
      <FormError error={state?.error} />
      <form action={formAction} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Naam"
          required
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="w-full px-3 py-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-primary text-surface py-2 rounded hover:bg-secondary"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}
