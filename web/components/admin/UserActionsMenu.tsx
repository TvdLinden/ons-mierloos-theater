'use client';

import { useState } from 'react';
import { User } from '@ons-mierloos-theater/shared/db';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui';

interface UserActionsMenuProps {
  user: User;
  onActionComplete?: () => void;
}

export function UserActionsMenu({ user, onActionComplete }: UserActionsMenuProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAction = async (action: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: data.error || 'An error occurred',
        });
        return;
      }

      setMessage({
        type: 'success',
        text: data.message || 'Action completed successfully',
      });

      onActionComplete?.();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to perform action',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            Acties
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => handleAction('resend-verification')}
            disabled={isLoading}
          >
            📧 Verificatie-email opnieuw versturen
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleAction('mark-verified')}
            disabled={isLoading || !!user.emailVerified}
            title={user.emailVerified ? 'User is already verified' : ''}
          >
            ✓ Handmatig als geverifieerd markeren
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleAction('clear-tokens')} disabled={isLoading}>
            🔄 Tokens wissen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {message && (
        <div
          className={`text-xs px-2 py-1 rounded-md whitespace-nowrap ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
