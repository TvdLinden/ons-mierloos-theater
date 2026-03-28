'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Performance } from '@ons-mierloos-theater/shared/db';
import DateDisplay from '@/components/DateDisplay';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { useCart } from '@/components/CartContext';
import { NumberInput } from './ui/number-input';
import { ShoppingCart } from 'lucide-react';

export type TimeslotPickerProps = {
  performances: Performance[];
  showTitle: string;
  onSelectPerformanceAction?: (performance: Performance, quantity: number) => Promise<void>;
  listClassName?: string; // Tailwind classes to override the list max-height, e.g. 'max-h-60'
};

export default function TimeslotPicker({
  performances,
  showTitle,
  onSelectPerformanceAction,
  listClassName,
}: TimeslotPickerProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const now = new Date();
  const availablePerformances = performances.filter((p) => {
    const perfDate = new Date(p.date);
    return p.status === 'published' && p.availableSeats > 0 && perfDate > now;
  });

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
    const soldOutPerformances = performances.filter((p) => p.status === 'sold_out');
    const pastPerformances = performances.filter(
      (p) => p.status === 'published' && new Date(p.date) <= now,
    );

    const isSoldOut = soldOutPerformances.length > 0;
    const isPast = pastPerformances.length > 0 && !isSoldOut;

    const shownPerformances = isSoldOut ? soldOutPerformances : pastPerformances;

    return (
      <div id="tickets" className="w-full flex flex-col gap-5">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span
            className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest text-white"
            style={{
              backgroundColor: isSoldOut ? 'var(--color-maroon)' : '#6b7280',
              fontFamily: 'var(--font-display)',
            }}
          >
            {isSoldOut ? 'Uitverkocht' : 'Afgelopen'}
          </span>
        </div>

        {/* Message */}
        <p className="text-sm text-muted-foreground">
          {isSoldOut
            ? 'Alle voorstellingen zijn uitverkocht. Schrijf je in voor de nieuwsbrief om als eerste te weten wanneer er nieuwe data zijn.'
            : isPast
              ? 'Deze voorstelling heeft al plaatsgevonden. Schrijf je in voor de nieuwsbrief om op de hoogte te blijven van nieuwe voorstellingen.'
              : 'Er zijn momenteel geen beschikbare voorstellingen.'}
        </p>

        {/* Past/sold-out dates shown greyed out */}
        {shownPerformances.length > 0 && (
          <div className={cn('space-y-1 max-h-44 opacity-40 overflow-y-auto', listClassName)}>
            {shownPerformances.map((p) => (
              <div
                key={p.id}
                className="w-full py-2 border-b border-black/10 text-sm flex items-center justify-between line-through"
              >
                <DateDisplay
                  value={new Date(p.date)}
                  options={{ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }}
                />
                <CurrencyDisplay value={p.price} />
              </div>
            ))}
          </div>
        )}

        {/* Newsletter CTA */}
        <div className="mt-auto pt-2 border-t border-black/10">
          <p
            className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Blijf op de hoogte
          </p>
          <a
            href="/#nieuwsbrief"
            className="w-full flex items-center justify-center px-5 py-3 text-white text-sm uppercase font-bold tracking-wider transition-[filter] hover:brightness-125"
            style={{ backgroundColor: 'var(--color-maroon)', fontFamily: 'var(--font-display)' }}
          >
            Nieuwsbrief
          </a>
        </div>
      </div>
    );
  }

  return (
    <div id="tickets" className="w-full flex flex-col gap-4">
      {/* Performance selector — always shown */}
      <div className={cn('space-y-1 max-h-44 overflow-y-auto', listClassName)}>
        {availablePerformances.map((performance) => (
          <button
            key={performance.id}
            onClick={() => setSelectedPerformanceId(performance.id)}
            className={`w-full text-left py-2 border-b border-black/10 text-sm transition-colors flex items-center justify-between ${
              selectedPerformanceId === performance.id
                ? 'font-bold text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <DateDisplay
              value={new Date(performance.date)}
              options={{ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }}
            />
            <CurrencyDisplay value={performance.price} />
          </button>
        ))}
      </div>

      {/* Selected performance details */}
      {selectedPerformance ? (
        <div className="space-y-1.5 text-sm">
          <p className="font-bold text-base">
            <DateDisplay
              value={new Date(selectedPerformance.date)}
              options={{ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }}
            />
          </p>
          <p>
            Tijd:{' '}
            {new Date(selectedPerformance.date).toLocaleTimeString('nl-NL', {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            uur
          </p>
          {selectedPerformance.notes && <p>Inclusief: {selectedPerformance.notes}</p>}
          <p>
            Prijs: <CurrencyDisplay value={selectedPerformance.price} />
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Selecteer een voorstelling hierboven.</p>
      )}

      {/* Quantity row */}
      {selectedPerformance && (
        <div className="flex items-center gap-3 text-sm">
          <span>Aantal:</span>
          <NumberInput
            value={quantity}
            onChange={(value) => setQuantity(Math.max(1, value || 1))}
            max={selectedPerformance.availableSeats}
            min={1}
            className="w-20"
          />
          {quantity > 1 && (
            <span className="text-muted-foreground">
              Totaal:{' '}
              <CurrencyDisplay
                value={
                  (typeof selectedPerformance.price === 'string'
                    ? parseFloat(selectedPerformance.price)
                    : selectedPerformance.price) * quantity
                }
              />
            </span>
          )}
        </div>
      )}

      {/* Success feedback */}
      {showSuccess && (
        <p className="text-sm text-green-700 font-medium">✓ Toegevoegd aan winkelwagen</p>
      )}

      {/* BESTELLEN button */}
      <button
        onClick={async () => {
          await handleAddToCart();
          router.push('/checkout');
        }}
        disabled={!selectedPerformance}
        className="w-full flex items-center justify-between px-5 py-4 text-white uppercase font-bold tracking-wider text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        style={{ backgroundColor: '#2d4059', fontFamily: 'var(--font-display)' }}
      >
        <span>Bestellen</span>

        <ShoppingCart className="h-5 w-5" />
      </button>
    </div>
  );
}
