'use client';

import Image from 'next/image';
import Link from 'next/link';
import ShoppingCart from './ShoppingCart';
import { useCart } from './CartContext';
import { useState, useEffect, useRef } from 'react';
import AccountMenu from '@/components/AccountMenu';
import { useSession, signOut } from 'next-auth/react';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui';
// import type { Session } from 'next-auth';

export default function Header() {
  const { items, removeFromCart, updateQuantity } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession(); //as { data: Session | null };
  const isAdmin =
    session?.user &&
    'role' in session.user &&
    (session.user.role === 'admin' || session.user.role === 'contributor');
  const cartRef = useRef<HTMLDivElement>(null);
  const mobileMenuContainerRef = useRef<HTMLDivElement>(null);

  // Close cart when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setCartOpen(false);
      }
    }

    if (cartOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [cartOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuContainerRef.current &&
        !mobileMenuContainerRef.current.contains(event.target as Node)
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
    <header className="w-full bg-primary dark:bg-accent py-4 shadow-lg border-b border-primary/20 relative z-40">
      <div className="max-w-4xl mx-auto flex items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-32 md:h-16 md:w-48 bg-white rounded-lg p-2 shadow-sm">
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
        <div className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" passHref>
                  <NavigationMenuLink className="text-secondary hover:text-secondary/80 px-3 font-medium">
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/sponsors" passHref>
                  <NavigationMenuLink className="text-secondary hover:text-secondary/80 px-3 font-medium">
                    Sponsors
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/contact" passHref>
                  <NavigationMenuLink className="text-secondary hover:text-secondary/80 px-3 font-medium">
                    Contact
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {isAdmin && (
                <NavigationMenuItem>
                  <Link href="/admin" passHref>
                    <NavigationMenuLink className="text-secondary hover:text-secondary/80 px-3 font-medium">
                      Beheer
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-4">
            <div className="relative" ref={cartRef}>
              <button
                className="relative"
                onClick={() => setCartOpen(!cartOpen)}
                aria-label="Open shopping cart"
              >
                <svg width={28} height={28} fill="none" viewBox="0 0 24 24">
                  <path d="M6 6h15l-1.5 9h-13z" stroke="#f7e9c1" strokeWidth={2} />
                  <circle cx={9} cy={21} r={1.5} fill="#f7e9c1" />
                  <circle cx={18} cy={21} r={1.5} fill="#f7e9c1" />
                </svg>
                {items.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-surface rounded-full px-2 text-xs font-bold">
                    {items.length}
                  </span>
                )}
              </button>
              {cartOpen && (
                <div className="absolute right-0 top-12 z-100 shadow-2xl">
                  <ShoppingCart
                    items={items}
                    onRemove={removeFromCart}
                    onChangeQuantity={updateQuantity}
                    showCheckoutButton={true}
                  />
                </div>
              )}
            </div>
            <AccountMenu />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <div className="relative" ref={cartRef}>
            <button
              className="relative p-2"
              onClick={() => setCartOpen(!cartOpen)}
              aria-label="Open shopping cart"
            >
              <svg width={24} height={24} fill="none" viewBox="0 0 24 24">
                <path d="M6 6h15l-1.5 9h-13z" stroke="#f7e9c1" strokeWidth={2} />
                <circle cx={9} cy={21} r={1.5} fill="#f7e9c1" />
                <circle cx={18} cy={21} r={1.5} fill="#f7e9c1" />
              </svg>
              {items.length > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-white rounded-full px-1.5 text-xs font-bold">
                  {items.length}
                </span>
              )}
            </button>
            {cartOpen && (
              <div className="fixed right-4 top-20 z-100 shadow-2xl">
                <ShoppingCart
                  items={items}
                  onRemove={removeFromCart}
                  onChangeQuantity={updateQuantity}
                  showCheckoutButton={true}
                />
              </div>
            )}
          </div>
          <button
            className="p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              width={24}
              height={24}
              fill="none"
              stroke="#f7e9c1"
              strokeWidth={2}
              strokeLinecap="round"
              viewBox="0 0 24 24"
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
          className="md:hidden absolute top-full left-0 right-0 bg-primary border-t border-primary/20 shadow-lg z-50"
        >
          <nav className="flex flex-col py-4">
            <Link
              href="/"
              className="text-secondary hover:text-secondary/80 px-6 py-3 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/sponsors"
              className="text-secondary hover:text-secondary/80 px-6 py-3 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sponsors
            </Link>
            <Link
              href="/contact"
              className="text-secondary hover:text-secondary/80 px-6 py-3 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-secondary hover:text-secondary/80 px-6 py-3 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Beheer
              </Link>
            )}
            {session ? (
              <>
                <Link
                  href="/account"
                  className="text-secondary hover:text-secondary/80 px-6 py-3 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mijn Account
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="text-secondary hover:text-secondary/80 px-6 py-3 font-medium text-left"
                >
                  Uitloggen
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="text-secondary hover:text-secondary/80 px-6 py-3 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inloggen
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
