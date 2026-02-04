import { redirect } from 'next/navigation';
import { db } from '@ons-mierloos-theater/shared/db';
import { users } from '@ons-mierloos-theater/shared/db/schema';
import { getUserByEmail } from '@ons-mierloos-theater/shared/queries/users';
import { hashPassword } from '@/lib/utils/auth';
import { isPasswordPolicyCompliant } from '@ons-mierloos-theater/shared/utils/password-policy';
import { generateVerificationToken, sendVerificationEmail } from '@ons-mierloos-theater/shared/utils/email';
import SignupForm from './SignupForm';

async function signupAction(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  if (!name || !email || !password) {
    return { error: 'All fields are required.' };
  }

  if (!isPasswordPolicyCompliant(password)) {
    return { error: 'Password does not meet the policy requirements.' };
  }

  // Check if user exists
  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: 'Email already in use.' };
  }

  // Generate verification token
  const verificationToken = generateVerificationToken();

  // Hash password
  const hashed = await hashPassword(password);

  // Insert user with verification token
  await db.insert(users).values({
    name,
    email,
    passwordHash: hashed,
    verificationToken,
    emailVerified: null,
  });

  // Send verification email
  const emailResult = await sendVerificationEmail(email, name, verificationToken);

  if (!emailResult.success) {
    console.error('Failed to send verification email:', emailResult.error);
    // User is created but email failed - they can request a new verification email
  }

  redirect('/auth/verify-pending');
}

export default async function SignupPage() {
  return <SignupForm action={signupAction} />;
}
