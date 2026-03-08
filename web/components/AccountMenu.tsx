'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, LogOut, LogIn } from 'lucide-react';

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }
  return email ? email[0].toUpperCase() : '?';
}

export default function AccountMenu() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
      >
        <LogIn className="size-4" />
        Inloggen
      </Link>
    );
  }

  const initials = getInitials(session.user?.name, session.user?.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open account menu"
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="font-semibold text-sm truncate">{session.user?.name || session.user?.email}</p>
          {session.user?.name && (
            <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center gap-2 cursor-pointer">
            <LayoutDashboard className="size-4" />
            Mijn account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
          onClick={() => signOut()}
        >
          <LogOut className="size-4" />
          Uitloggen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
