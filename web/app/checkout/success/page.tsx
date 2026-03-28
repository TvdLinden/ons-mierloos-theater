'use client';
import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';

export default function CheckoutSuccessPage() {
  return (
    <div
      className="page-parchment min-h-screen"
      style={{ backgroundColor: 'var(--color-parchment)' }}
    >
      <div className="bg-white h-8" />
      <div className="max-w-xl mx-auto px-4 py-12">
        <Suspense fallback={<div>Laden...</div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </div>
  );
}

function SuccessContent() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="border border-border bg-white p-8 lg:p-12 shadow-lg text-center">
      <div className="mb-6">
        <svg
          className="mx-auto h-16 w-16 text-success"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1
        className="text-3xl md:text-4xl font-bold uppercase mb-4"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Betaling in behandeling
      </h1>
      <p className="text-muted-foreground mb-3">
        Je betaling wordt verwerkt. Je ontvangt een bevestigingsmail zodra de betaling is voltooid.
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        Dit kan enkele momenten duren. Controleer je e-mail voor de bevestiging en tickets.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wide hover:bg-secondary hover:text-secondary-foreground transition-colors"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Terug naar home
      </Link>
    </div>
  );
}
