'use client';

import { Performance } from '@ons-mierloos-theater/shared/db';
import { Button } from '@/components/ui';
import CurrencyDisplay from '@/components/CurrencyDisplay';

export type MobileBookingBarProps = {
  performances: Performance[];
};

export default function MobileBookingBar({ performances }: MobileBookingBarProps) {
  const now = new Date();
  const upcoming = performances.filter((p) => {
    const perfDate = new Date(p.date);
    return p.status === 'published' && p.availableSeats > 0 && perfDate > now;
  });

  if (upcoming.length === 0) return null;

  const prices = upcoming.map((p) => parseFloat(p.price as string)).filter((p) => !isNaN(p));
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;

  const handleClick = () => {
    const el = document.getElementById('tickets');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between max-w-screen-sm mx-auto">
        {minPrice !== null && (
          <div className="text-sm text-muted-foreground">
            Vanaf{' '}
            <span className="font-semibold text-foreground">
              <CurrencyDisplay value={minPrice} />
            </span>
          </div>
        )}
        <Button onClick={handleClick} size="lg">
          Bestel kaartjes
        </Button>
      </div>
    </div>
  );
}
