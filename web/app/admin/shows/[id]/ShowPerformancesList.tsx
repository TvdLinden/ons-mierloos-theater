'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type Performance = {
  id: string;
  date: Date | string;
  price: string | null;
  totalSeats: number | null;
  availableSeats: number | null;
  status: 'draft' | 'published' | 'sold_out' | 'cancelled' | 'archived';
};

const STATUS_LABELS: Record<Performance['status'], string> = {
  draft: 'Concept',
  published: 'Gepubliceerd',
  sold_out: 'Uitverkocht',
  cancelled: 'Geannuleerd',
  archived: 'Gearchiveerd',
};

const STATUS_CLASSES: Record<Performance['status'], string> = {
  published: 'bg-green-100 text-green-800',
  sold_out: 'bg-red-100 text-red-800',
  cancelled: 'bg-zinc-100 text-zinc-800',
  draft: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-zinc-100 text-zinc-500',
};

function PerformanceRow({ performance, showId }: { performance: Performance; showId: string }) {
  const sold = (performance.totalSeats || 0) - (performance.availableSeats || 0);
  const pct = performance.totalSeats ? Math.round((sold / performance.totalSeats) * 100) : 0;

  return (
    <div className="flex items-center gap-2 py-3 -mx-2 px-2 rounded hover:bg-zinc-50 group">
      <Link
        href={`/admin/shows/${showId}/performances/${performance.id}`}
        className="flex flex-1 items-center gap-4 min-w-0"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary">
            {new Date(performance.date).toLocaleString('nl-NL', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_CLASSES[performance.status]}`}
            >
              {STATUS_LABELS[performance.status]}
            </span>
            <span className="text-xs text-zinc-400">€{performance.price}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-medium">
            {sold}{' '}
            <span className="text-zinc-400 font-normal">/ {performance.totalSeats} verkocht</span>
          </p>
          <div className="mt-1 h-1.5 w-28 bg-zinc-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{pct}% bezet</p>
        </div>
      </Link>

      <Link
        href={`/admin/shows/${showId}/performances/${performance.id}/edit`}
        className="shrink-0 p-1.5 rounded text-zinc-400 hover:text-primary hover:bg-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Bewerken"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export function ShowPerformancesList({
  performances,
  showId,
}: {
  performances: Performance[];
  showId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_COUNT = 5;
  const hasMore = performances.length > INITIAL_COUNT;

  return (
    <div className="divide-y divide-zinc-100">
      {performances.slice(0, INITIAL_COUNT).map((p) => (
        <PerformanceRow key={p.id} performance={p} showId={showId} />
      ))}

      {hasMore && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleContent className="overflow-hidden divide-y divide-zinc-100 data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
            {performances.slice(INITIAL_COUNT).map((p) => (
              <PerformanceRow key={p.id} performance={p} showId={showId} />
            ))}
          </CollapsibleContent>
          <CollapsibleTrigger className="pt-3 text-xs text-primary hover:underline cursor-pointer">
            {expanded ? 'Minder tonen' : `+${performances.length - INITIAL_COUNT} meer speeltijden`}
          </CollapsibleTrigger>
        </Collapsible>
      )}
    </div>
  );
}
