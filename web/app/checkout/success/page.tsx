'use client';
import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';

export default function CheckoutSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <Suspense fallback={<div>Laden...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}

function SuccessContent() {
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear shopping cart on successful checkout
    clearCart();
  }, [clearCart]);
  return (
    <div className="bg-surface p-8 text-center">
      <div className="mb-6">
        <svg
          className="mx-auto h-16 w-16 text-green-500"
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
      <h1 className="text-3xl font-bold mb-4 text-primary">Betaling in behandeling</h1>
      <p className="text-zinc-700 mb-6">
        Je betaling wordt verwerkt. Je ontvangt een bevestigingsmail zodra de betaling is voltooid.
      </p>
      <p className="text-sm text-zinc-600 mb-8">
        Dit kan enkele momenten duren. Controleer je e-mail voor de bevestiging en tickets.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-primary text-surface rounded font-bold hover:bg-secondary"
      >
        Terug naar home
      </Link>
    </div>
  );
}
