import { Performance } from '@ons-mierloos-theater/shared/db';
import { Calendar, Ticket } from 'lucide-react';
import DateDisplay from './DateDisplay';
import CurrencyDisplay from './CurrencyDisplay';

export type PerformanceSummaryProps = {
  performances: Performance[];
};

export default function PerformanceSummary({ performances }: PerformanceSummaryProps) {
  const now = new Date();
  const upcoming = performances.filter((p) => {
    const perfDate = new Date(p.date);
    return p.status === 'published' && p.availableSeats > 0 && perfDate > now;
  });

  if (upcoming.length === 0) return null;

  const earliest = upcoming.reduce((min, p) => (new Date(p.date) < new Date(min.date) ? p : min));

  const prices = upcoming.map((p) => parseFloat(p.price as string)).filter((p) => !isNaN(p));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const hasPriceRange = prices.length > 0 && minPrice !== maxPrice;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-muted rounded-lg px-5 py-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>
          {upcoming.length} {upcoming.length === 1 ? 'voorstelling' : 'voorstellingen'}
        </span>
        <span className="text-border">·</span>
        <DateDisplay
          value={new Date(earliest.date)}
          options={{ weekday: 'short', day: 'numeric', month: 'short' }}
        />
      </div>

      {prices.length > 0 && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Ticket className="h-4 w-4" />
          {hasPriceRange ? (
            <span>
              <CurrencyDisplay value={minPrice} /> – <CurrencyDisplay value={maxPrice} />
            </span>
          ) : (
            <CurrencyDisplay value={minPrice} />
          )}
        </div>
      )}
    </div>
  );
}
