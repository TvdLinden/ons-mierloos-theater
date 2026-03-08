'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from './CartContext';
import { useState, useEffect, useRef } from 'react';
import AccountMenu from '@/components/AccountMenu';
import { useSession, signOut } from 'next-auth/react';
import type { NavigationLink } from '@ons-mierloos-theater/shared/db';
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

type HeaderProps = {
  navigationLinks?: NavigationLink[];
};

export default function Header({ navigationLinks = [] }: HeaderProps) {
  const { items } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession(); //as { data: Session | null };
  const isAdmin =
    session?.user &&
    'role' in session.user &&
    (session.user.role === 'admin' || session.user.role === 'contributor');
  const mobileMenuContainerRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    // Keep a reference to the button so outside click logic can detect it
    hamburgerButtonRef.current = e.currentTarget;

    // Temporarily capture the next document mousedown and stop it so the
    // document-level "click outside" handler doesn't immediately close the menu.
    const stopNextDocMouseDown = (ev: MouseEvent) => {
      ev.stopPropagation();
      document.removeEventListener('mousedown', stopNextDocMouseDown, true);
    };
    document.addEventListener('mousedown', stopNextDocMouseDown, true);

    // Toggle on the next tick to avoid races with other handlers.
    setTimeout(() => {
      setMobileMenuOpen((prev) => !prev);
      // Clean up in case the captured mousedown never fired.
      document.removeEventListener('mousedown', stopNextDocMouseDown, true);
    }, 0);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuContainerRef.current &&
        !mobileMenuContainerRef.current.contains(event.target as Node) &&
        !hamburgerButtonRef.current?.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  return (
    <header className="w-full bg-white relative z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 md:px-8 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-32 md:h-14 md:w-40">
            <Image
              src="/logo.png"
              alt="Ons Mierloos Theater"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navigationLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="text-gray-800 hover:text-primary font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-gray-800 hover:text-primary font-medium transition-colors"
            >
              Beheer
            </Link>
          )}
          <div className="flex items-center gap-6 ml-4 pl-4 border-l border-gray-200">
            <Link
              href="/winkelwagen"
              className="relative text-gray-800 hover:text-primary transition-colors"
              aria-label="Winkelwagen"
            >
              <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
                <path d="M6 6h15l-1.5 9h-13z" stroke="currentColor" strokeWidth={2} />
                <circle cx={9} cy={21} r={1.5} fill="currentColor" />
                <circle cx={18} cy={21} r={1.5} fill="currentColor" />
              </svg>
              {items.length > 0 && (
                <span
                  className="absolute -top-2 -right-2 bg-primary text-white rounded-full px-1.5 text-xs font-bold"
                  suppressHydrationWarning
                >
                  {items.length}
                </span>
              )}
            </Link>
            <AccountMenu />
          </div>
        </div>

        {/* Mobile Menu Button - only show hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            className="p-2 text-gray-800 hover:text-primary transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <svg
              width={28}
              height={28}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              viewBox="0 0 24 24"
              className={`transition-transform duration-300 ease-in-out ${
                mobileMenuOpen ? 'rotate-90' : 'rotate-0'
              }`}
            >
              {mobileMenuOpen ? (
                <>
                  <path d="M18 6L6 18M6 6l12 12" />
                </>
              ) : (
                <>
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuContainerRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white z-50 animate-in slide-in-from-top-2 duration-300"
        >
          <nav className="flex flex-col py-2">
            {navigationLinks.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="text-gray-800 hover:text-primary px-6 py-3 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-gray-800 hover:text-primary px-6 py-3 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Beheer
              </Link>
            )}
            <div className="border-t border-gray-200 my-2 pt-2">
              <Link
                href="/winkelwagen"
                className="relative text-gray-800 hover:text-primary transition-colors flex items-center gap-2 px-6 py-3 font-medium"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Winkelwagen"
              >
                <svg width={20} height={20} fill="none" viewBox="0 0 24 24">
                  <path d="M6 6h15l-1.5 9h-13z" stroke="currentColor" strokeWidth={2} />
                  <circle cx={9} cy={21} r={1.5} fill="currentColor" />
                  <circle cx={18} cy={21} r={1.5} fill="currentColor" />
                </svg>
                Winkelwagen
                {items.length > 0 && (
                  <span className="bg-primary text-white rounded-full px-2 text-xs font-bold">
                    {items.length}
                  </span>
                )}
              </Link>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2">
              {session ? (
                <>
                  <div className="flex items-center gap-3 px-6 py-3">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {getInitials(session.user?.name, session.user?.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{session.user?.name || session.user?.email}</p>
                      {session.user?.name && (
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 text-gray-800 hover:text-primary px-6 py-3 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="size-4" />
                    Mijn account
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); signOut(); }}
                    className="flex items-center gap-2 w-full text-left text-red-600 hover:text-red-700 px-6 py-3 font-medium"
                  >
                    <LogOut className="size-4" />
                    Uitloggen
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className="flex items-center gap-2 text-gray-800 hover:text-primary px-6 py-3 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="size-4" />
                  Inloggen
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
