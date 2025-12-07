'use client';

import Image from 'next/image';
import Link from 'next/link';
import ShoppingCart from './ShoppingCart';
import { useCart } from './CartContext';
import { useState, useEffect, useRef } from 'react';
import AccountMenu from '@/components/AccountMenu';
import { useSession, signOut } from 'next-auth/react';

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
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

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
          <Link href="/" className="text-gray-800 hover:text-primary font-medium transition-colors">
            Home
          </Link>
          <Link
            href="/voorstellingen"
            className="text-gray-800 hover:text-primary font-medium transition-colors"
          >
            Voorstellingen
          </Link>
          <Link
            href="/sponsors"
            className="text-gray-800 hover:text-primary font-medium transition-colors"
          >
            Sponsors
          </Link>
          <Link
            href="/contact"
            className="text-gray-800 hover:text-primary font-medium transition-colors"
          >
            Contact
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="text-gray-800 hover:text-primary font-medium transition-colors"
            >
              Beheer
            </Link>
          )}
          <div className="flex items-center gap-6 ml-4 pl-4 border-l border-gray-200">
            <div className="relative" ref={cartRef}>
              <button
                className="relative text-gray-800 hover:text-primary transition-colors"
                onClick={() => setCartOpen(!cartOpen)}
                aria-label="Open shopping cart"
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
              </button>
              {cartOpen && (
                <div className="absolute right-0 top-10 z-100 shadow-2xl">
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

        {/* Mobile Menu Button - only show hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            className="p-2 text-gray-800 hover:text-primary transition-colors"
            onClick={(e) => {
              if (mobileMenuOpen) {
                e.stopPropagation();
              }
              setMobileMenuOpen(!mobileMenuOpen);
            }}
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
            <Link
              href="/"
              className="text-gray-800 hover:text-primary px-6 py-3 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/sponsors"
              className="text-gray-800 hover:text-primary px-6 py-3 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sponsors
            </Link>
            <Link
              href="/contact"
              className="text-gray-800 hover:text-primary px-6 py-3 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
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
              <div className="relative px-6 py-3" ref={cartRef}>
                <button
                  className="relative text-gray-800 hover:text-primary transition-colors flex items-center gap-2 w-full"
                  onClick={() => setCartOpen(!cartOpen)}
                  aria-label="Open shopping cart"
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
                </button>
                {cartOpen && (
                  <div className="mt-3 shadow-lg">
                    <ShoppingCart
                      items={items}
                      onRemove={removeFromCart}
                      onChangeQuantity={updateQuantity}
                      showCheckoutButton={true}
                    />
                  </div>
                )}
              </div>
            </div>
            {session ? (
              <>
                <Link
                  href="/account"
                  className="text-gray-800 hover:text-primary px-6 py-3 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mijn Account
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="text-gray-800 hover:text-primary px-6 py-3 font-medium text-left"
                >
                  Uitloggen
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="text-gray-800 hover:text-primary px-6 py-3 font-medium"
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
