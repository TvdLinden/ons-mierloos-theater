'use server';

import { requireRole } from '@/lib/utils/auth';
import { UserRole } from '@ons-mierloos-theater/shared/db';
import { updateUser } from '@ons-mierloos-theater/shared/commands/users';
import { revalidatePath } from 'next/cache';

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Only admins can change user roles
    await requireRole('admin');

    // Validate the role
    const validRoles: UserRole[] = ['user', 'admin', 'contributor'];
    if (!validRoles.includes(newRole)) {
      return { success: false, error: 'Invalid role specified' };
    }

    // Update the user's role
    await updateUser(userId, { role: newRole });

    // Revalidate the users page
    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}
