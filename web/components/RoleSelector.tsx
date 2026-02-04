'use client';

import { UserRole } from '@ons-mierloos-theater/shared/db';
import { updateUserRole } from '@/lib/actions/users';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui';

export type RoleSelectorProps = {
  userId: string;
  currentRole: string;
  disabled?: boolean;
};

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'user', label: 'Gebruiker' },
  { value: 'contributor', label: 'Medewerker' },
  { value: 'admin', label: 'Beheerder' },
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
      <Select
        value={role}
        onValueChange={(value) => handleRoleChange(value as UserRole)}
        disabled={disabled || isUpdating}
      >
        <SelectTrigger className="">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="text-xs text-error">{error}</span>}
    </div>
  );
}
