'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CheckoutErrorPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <Suspense fallback={<div>Laden...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorType: string | null) => {
    switch (errorType) {
      case 'failed':
        return {
          title: 'Betaling mislukt',
          message: 'Je betaling kon niet worden verwerkt.',
          details: 'Controleer je betaalgegevens en probeer het opnieuw.',
        };
      case 'canceled':
        return {
          title: 'Betaling geannuleerd',
          message: 'Je hebt de betaling geannuleerd.',
          details: 'Probeer het opnieuw wanneer je klaar bent.',
        };
      default:
        return {
          title: 'Er is een fout opgetreden',
          message: 'Er is iets mis gegaan met je bestelling.',
          details: 'Probeer het later opnieuw of neem contact op met ondersteuning.',
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="bg-surface p-8 text-center">
      <div className="mb-6">
        <svg
          className="mx-auto h-16 w-16 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-4 text-red-600">{errorInfo.title}</h1>
      <p className="text-zinc-700 mb-6">{errorInfo.message}</p>
      <p className="text-sm text-zinc-600 mb-8">{errorInfo.details}</p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/checkout"
          className="inline-block px-6 py-3 bg-primary text-surface rounded font-bold hover:bg-secondary"
        >
          Terug naar winkelwagen
        </Link>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-zinc-200 text-zinc-900 rounded font-bold hover:bg-zinc-300"
        >
          Naar home
        </Link>
      </div>
    </div>
  );
}
