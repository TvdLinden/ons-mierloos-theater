import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, isNotNull, gt } from 'drizzle-orm';
import { hashPassword, isPasswordPolicyCompliant } from '@/lib/utils/auth';

async function handleResetPassword(
  token: string,
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  'use server';

  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    return { error: 'Alle velden zijn verplicht' };
  }

  if (password !== confirmPassword) {
    return { error: 'Wachtwoorden komen niet overeen' };
  }

  if (!isPasswordPolicyCompliant(password)) {
    return { error: 'Wachtwoord voldoet niet aan de eisen' };
  }

  // Find user with valid reset token
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.resetToken, token),
        isNotNull(users.resetToken),
        gt(users.resetTokenExpiry, new Date()),
      ),
    )
    .limit(1);

  if (!user) {
    return { error: 'Ongeldige of verlopen reset link' };
  }

  // Hash new password
  const passwordHash = await hashPassword(password);

  // Update password and clear reset token
  await db
    .update(users)
    .set({
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    })
    .where(eq(users.id, user.id));

  redirect('/auth/reset-success');
}

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    notFound();
  }

  // Verify token exists and is not expired
  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.resetToken, token),
        isNotNull(users.resetToken),
        gt(users.resetTokenExpiry, new Date()),
      ),
    )
    .limit(1);

  if (!user) {
    redirect('/auth/reset-expired');
  }

  const boundResetAction = handleResetPassword.bind(null, token);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-surface rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2 text-primary">Nieuw wachtwoord instellen</h1>
        <p className="text-text-secondary text-sm">Kies een nieuw wachtwoord voor je account.</p>
      </div>

      <form action={boundResetAction} className="space-y-4">
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
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-text-secondary mt-1">Minimaal 8 tekens</p>
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
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
        >
          Wachtwoord opslaan
        </button>
      </form>
    </div>
  );
}
