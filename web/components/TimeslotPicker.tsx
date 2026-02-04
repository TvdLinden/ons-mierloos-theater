'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Performance } from '@ons-mierloos-theater/shared/db';
import { Button } from '@/components/ui';
import DateDisplay from '@/components/DateDisplay';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { useCart } from '@/components/CartContext';
import { NumberInput } from './ui/number-input';

export type TimeslotPickerProps = {
  performances: Performance[];
  showTitle: string;
  onSelectPerformanceAction?: (performance: Performance, quantity: number) => Promise<void>;
};

export default function TimeslotPicker({
  performances,
  showTitle,
  onSelectPerformanceAction,
}: TimeslotPickerProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  // Filter performances: must be published, have available seats, and be in the future
  // (This is a safety net - the server should already filter past dates)
  const now = new Date();
  const availablePerformances = performances.filter((p) => {
    const perfDate = new Date(p.date);
    return p.status === 'published' && p.availableSeats > 0 && perfDate > now;
  });

  // Auto-select the first (and only) performance if there's only one available
  const defaultPerformanceId =
    availablePerformances.length === 1 ? availablePerformances[0].id : null;

  const [selectedPerformanceId, setSelectedPerformanceId] = useState<string | null>(
    defaultPerformanceId,
  );
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedPerformance = availablePerformances.find((p) => p.id === selectedPerformanceId);

  const handleAddToCart = async () => {
    if (!selectedPerformance) return;

    if (onSelectPerformanceAction) {
      await onSelectPerformanceAction(selectedPerformance, quantity);
    }

    addToCart({
      id: selectedPerformance.id,
      title: `${showTitle} - ${new Date(selectedPerformance.date).toLocaleDateString('nl-NL')} ${new Date(selectedPerformance.date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`,
      price:
        typeof selectedPerformance.price === 'string'
          ? parseFloat(selectedPerformance.price)
          : selectedPerformance.price,
      quantity,
    });

    setShowSuccess(true);
    setQuantity(1);
    setSelectedPerformanceId(null);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (availablePerformances.length === 0) {
    return (
      <div className="mt-6 w-full">
        <p className="text-center text-accent dark:text-surface">
          Helaas zijn er geen beschikbare voorstellingen.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full">
      <h2 className="text-xl font-bold text-primary dark:text-secondary mb-4">
        Selecteer een Voorstelling
      </h2>

      <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
        {availablePerformances.map((performance) => (
          <button
            key={performance.id}
            onClick={() => setSelectedPerformanceId(performance.id)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              selectedPerformanceId === performance.id
                ? 'border-secondary bg-secondary/10'
                : 'border-border bg-muted hover:border-secondary'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-primary dark:text-secondary">
                  <DateDisplay
                    value={new Date(performance.date)}
                    options={{ dateStyle: 'medium', timeStyle: 'short' }}
                  />
                </p>
                <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                  Beschikbaar: {performance.availableSeats} / {performance.totalSeats} plaatsen
                </p>
                {performance.notes && (
                  <p className="text-xs text-text-secondary dark:text-gray-500 mt-1 italic">
                    {performance.notes}
                  </p>
                )}
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-primary dark:text-secondary">
                  <CurrencyDisplay value={performance.price} />
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedPerformance && (
        <div className="bg-muted dark:bg-accent/50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-text-secondary dark:text-gray-400">
                Geselecteerde voorstelling:
              </p>
              <p className="font-semibold text-primary dark:text-secondary">
                <DateDisplay
                  value={new Date(selectedPerformance.date)}
                  options={{ dateStyle: 'medium', timeStyle: 'short' }}
                />
              </p>
            </div>
            <p className="text-lg font-bold text-primary dark:text-secondary">
              <CurrencyDisplay value={parseFloat(selectedPerformance.price) * quantity} />
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="quantity" className="text-primary font-medium">
              Aantal kaartjes:
            </label>
            <NumberInput
              value={quantity}
              onChange={(value) => setQuantity(Math.max(1, value || 1))}
              max={selectedPerformance.availableSeats}
              min={1}
              className="w-20"
            />
            <span className="text-sm text-text-secondary dark:text-gray-400">
              Totaal:{' '}
              <CurrencyDisplay
                value={
                  (typeof selectedPerformance.price === 'string'
                    ? parseFloat(selectedPerformance.price)
                    : selectedPerformance.price) * quantity
                }
              />
            </span>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-lg text-center font-medium mb-4">
          ✓ Toegevoegd aan winkelwagen
        </div>
      )}

      <Button
        onClick={async () => {
          await handleAddToCart();
          router.push('/checkout');
        }}
        disabled={!selectedPerformance}
        variant="outline"
        size="lg"
        className="w-full"
      >
        {selectedPerformance ? 'Naar Kassa' : 'Selecteer eerst een voorstelling'}
      </Button>
    </div>
  );
}
