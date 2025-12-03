'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';

export default function AccountMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  if (!session) {
    return (
      <Link href="/auth/signin" className="text-secondary hover:text-secondary px-3 font-medium">
        Sign In
      </Link>
    );
  }
  return (
    <div className="relative" ref={menuRef}>
      <button
        className="text-secondary hover:text-secondary px-3 font-medium"
        onClick={() => setOpen(!open)}
        aria-label="Open account menu"
      >
        Account
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-surface dark:bg-accent rounded shadow z-50">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
            <div className="font-bold">{session.user?.name || session.user?.email}</div>
            <div className="text-xs text-accent">{session.user?.email}</div>
          </div>
          <ul className="py-2">
            <li>
              <Link
                href="/account"
                className="block px-4 py-2 hover:bg-surface dark:hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                Account Dashboard
              </Link>
            </li>
            <li>
              <button
                onClick={() => signOut()}
                className="block w-full text-left px-4 py-2 hover:bg-surface dark:hover:bg-accent text-primary"
              >
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
