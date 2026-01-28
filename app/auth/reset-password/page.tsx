import { redirect, notFound } from 'next/navigation';
import {
  hashPassword,
  validateResetToken,
} from '@/lib/utils/auth';
import { isPasswordPolicyCompliant, getPasswordPolicyText } from '@/lib/utils/password-policy';
import { resetUserPassword } from '@/lib/commands/users';
import ResetPasswordForm from './reset-password-form';

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
    return { error: 'Wachtwoord voldoet niet aan de eisen: ' + getPasswordPolicyText() };
  }

  // Validate token and get user
  const user = await validateResetToken(token);
  if (!user) {
    return { error: 'Ongeldige of verlopen reset link' };
  }

  // Hash new password
  const passwordHash = await hashPassword(password);

  // Update password and clear reset token
  await resetUserPassword(user.id, passwordHash);

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

  // Validate token on the server
  const user = await validateResetToken(token);
  if (!user) {
    redirect('/auth/reset-expired');
  }

  const boundResetAction = handleResetPassword.bind(null, token);
  return <ResetPasswordForm boundAction={boundResetAction} />;
}
