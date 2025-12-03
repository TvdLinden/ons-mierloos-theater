'use server';

// redirect not needed here
import { getUserByEmail } from '@/lib/queries/users';
import { updateUser } from '@/lib/commands/users';
import { generateVerificationToken, sendPasswordResetEmail } from '@/lib/utils/email';

export async function forgotPasswordAction(
  prevState: { error?: string; success?: boolean },
  formData: FormData,
) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'E-mailadres is verplicht' };
  }

  // Find user by email
  const user = await getUserByEmail(email);

  // Always return success message for security (don't reveal if email exists)
  if (!user) {
    return { success: true };
  }

  // Generate reset token (expires in 1 hour)
  const resetToken = generateVerificationToken();
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Update user with reset token
  await updateUser(user.id, {
    resetToken,
    resetTokenExpiry,
  });

  // Send password reset email
  const emailResult = await sendPasswordResetEmail(email, user.name || 'daar', resetToken);

  if (!emailResult.success) {
    console.error('Failed to send password reset email:', emailResult.error);
    // Don't reveal error to user for security
  }

  return { success: true };
}
