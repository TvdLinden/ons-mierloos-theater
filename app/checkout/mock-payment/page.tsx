'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function MockPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const paymentId = searchParams.get('id');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  const handlePayment = async (status: 'paid' | 'failed' | 'canceled') => {
    setProcessing(true);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Call our webhook to update payment status
    try {
      const response = await fetch('/api/webhooks/mock-mollie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: paymentId,
          status: status,
        }),
      });

      if (response.ok) {
        router.push(`/checkout/success?orderId=${orderId}`);
      } else {
        alert('Er is een fout opgetreden bij het verwerken van de betaling.');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Mock payment error:', error);
      alert('Er is een fout opgetreden bij het verwerken van de betaling.');
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <div className="bg-surface rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <svg
              className="h-12 w-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Mock Betaling</h1>
          <p className="text-sm text-zinc-600 mb-4">
            Dit is een testomgeving. Geen echte betaling wordt verwerkt.
          </p>
        </div>

        <div className="bg-zinc-50 p-4 rounded mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-zinc-600">Order ID:</span>
            <span className="font-mono text-sm">{orderId?.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-zinc-600">Bedrag:</span>
            <span className="font-bold text-lg">€{amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-600">Betaling ID:</span>
            <span className="font-mono text-sm">{paymentId?.substring(0, 15)}...</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handlePayment('paid')}
            disabled={processing}
            className="w-full px-6 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Verwerken...' : '✓ Betaling Succesvol'}
          </button>
          <button
            onClick={() => handlePayment('failed')}
            disabled={processing}
            className="w-full px-6 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Verwerken...' : '✗ Betaling Mislukt'}
          </button>
          <button
            onClick={() => handlePayment('canceled')}
            disabled={processing}
            className="w-full px-6 py-3 bg-zinc-400 text-white rounded font-bold hover:bg-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Verwerken...' : 'Annuleren'}
          </button>
        </div>

        <p className="text-xs text-zinc-500 text-center mt-6">
          In productie zou dit de Mollie betalingspagina zijn.
        </p>
      </div>
    </div>
  );
}
