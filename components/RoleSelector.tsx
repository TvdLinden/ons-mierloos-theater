'use client';

import { UserRole } from '@/lib/db';
import { updateUserRole } from '@/lib/actions/users';
import { useState } from 'react';

export type RoleSelectorProps = {
  userId: string;
  currentRole: string;
  disabled?: boolean;
};

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'contributor', label: 'Contributor' },
  { value: 'admin', label: 'Admin' },
];

export default function RoleSelector({ userId, currentRole, disabled }: RoleSelectorProps) {
  const [role, setRole] = useState<string>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === role) return;

    setIsUpdating(true);
    setError(null);

    const result = await updateUserRole(userId, newRole);

    if (result.success) {
      setRole(newRole);
    } else {
      setError(result.error || 'Failed to update role');
      // Revert select to previous value
      setTimeout(() => setError(null), 3000);
    }

    setIsUpdating(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <select
        value={role}
        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
        disabled={disabled || isUpdating}
        className="px-3 py-1.5 text-sm rounded-lg border border-border bg-surface text-primary
          focus:outline-none focus:ring-2 focus:ring-primary/50
          disabled:opacity-50 disabled:cursor-not-allowed
          dark:bg-zinc-800 dark:border-zinc-700 dark:text-surface"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
