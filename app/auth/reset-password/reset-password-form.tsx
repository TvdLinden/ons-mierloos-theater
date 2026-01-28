'use client';

import { useActionState, useState } from 'react';
import { getPasswordPolicyText } from '@/lib/utils/password-policy';
import FormError from '@/components/FormError';

interface ResetPasswordFormProps {
  boundAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}

export default function ResetPasswordForm({ boundAction }: ResetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    boundAction as (
      prevState: { error?: string; success?: boolean } | null,
      formData: FormData,
    ) => Promise<{ error?: string; success?: boolean }>,
    null as { error?: string; success?: boolean } | null,
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setPasswordsMatch(value === password);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordsMatch(confirmPassword === value);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2 text-primary">Nieuw wachtwoord instellen</h1>
        <p className="text-text-secondary text-sm">Kies een nieuw wachtwoord voor je account.</p>
      </div>

      {state?.error && <FormError error={state.error} />}

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
            Nieuw wachtwoord
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={8}
            value={password}
            onChange={handlePasswordChange}
            disabled={pending}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-xs text-text-secondary mt-1">{getPasswordPolicyText()}</p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-text-primary mb-1"
          >
            Bevestig wachtwoord
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            minLength={8}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            disabled={pending}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-500 mt-1">Wachtwoorden komen niet overeen</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending || !passwordsMatch || !password || !confirmPassword}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? 'Wachtwoord opslaan...' : 'Wachtwoord opslaan'}
        </button>
      </form>
    </div>
  );
}
