'use client';

import { useSession } from 'next-auth/react';
import type { UserRole } from '../db';

/**
 * Client-side hook to check if the current user has one of the allowed roles.
 * Returns true if authorized, false otherwise.
 */
export function useHasRole(roles: UserRole | UserRole[]) {
  const { data: session } = useSession();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (
    session?.user && 'role' in session.user && allowedRoles.includes(session.user.role as UserRole)
  );
}
