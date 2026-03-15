'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DataTable, Row, Column, EmptyRow, FilterState } from '@/components/admin/DataTable';

type PerformanceSale = {
  performanceId: string;
  showId: string;
  showTitle: string;
  performanceDate: string | Date | null;
  totalSeats: number | null;
  totalTickets: number;
  totalRevenue: string;
  minRow: number | null;
  maxRow: number | null;
  minSeat: number | null;
  maxSeat: number | null;
};

type SortKey = 'showTitle' | 'performanceDate' | 'totalTickets' | 'totalRevenue';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

const FILTER_DEFINITIONS = [
  {
    label: 'Voorstelling',
    key: 'search',
    filterType: 'text' as const,
    placeholder: 'Zoek op titel...',
  },
  { label: 'Van datum', key: 'fromDate', filterType: 'date' as const },
  { label: 'Tot datum', key: 'toDate', filterType: 'date' as const },
];

function SoldBar({ sold, total }: { sold: number; total: number }) {
  const pct = total > 0 ? Math.min((sold / total) * 100, 100) : 0;
  const isSoldOut = pct >= 100;
  const isNearlyFull = pct >= 80;

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isSoldOut ? 'bg-red-500' : isNearlyFull ? 'bg-amber-400' : 'bg-emerald-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">
        {sold}
        <span className="text-zinc-300">/{total}</span>
      </span>
    </div>
  );
}

function SeatRange({
  minRow,
  maxRow,
  minSeat,
  maxSeat,
}: {
  minRow: number | null;
  maxRow: number | null;
  minSeat: number | null;
  maxSeat: number | null;
}) {
  if (minRow === null) return <span className="text-zinc-400">—</span>;

  const rowLabel = minRow === maxRow ? `Rij ${minRow}` : `Rij ${minRow}–${maxRow}`;
  const seatLabel = minSeat === maxSeat ? `Stoel ${minSeat}` : `Stoel ${minSeat}–${maxSeat}`;

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-zinc-700 tabular-nums">{rowLabel}</span>
      <span className="text-xs text-zinc-400 tabular-nums">{seatLabel}</span>
    </div>
  );
}

export function PerformanceSalesTable({ sales }: { sales: PerformanceSale[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('performanceDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filters, setFilters] = useState<FilterState>({});
  const [page, setPage] = useState(0);

  const handleSort = (key: string) => {
    const sortKey = key as SortKey;
    if (sortBy === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(sortKey);
      setSortDir('desc');
    }
    setPage(0);
  };

  const handleFiltersChange = (next: FilterState) => {
    setFilters(next);
    setPage(0);
  };

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (filters.search) {
        const q = (filters.search as string).toLowerCase();
        if (!s.showTitle.toLowerCase().includes(q)) return false;
      }
      if (filters.fromDate) {
        const from = new Date(filters.fromDate as string);
        if (s.performanceDate && new Date(s.performanceDate) < from) return false;
      }
      if (filters.toDate) {
        const to = new Date(filters.toDate as string);
        if (s.performanceDate && new Date(s.performanceDate) > to) return false;
      }
      return true;
    });
  }, [sales, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'performanceDate') {
        cmp =
          new Date(a.performanceDate ?? 0).getTime() - new Date(b.performanceDate ?? 0).getTime();
      } else if (sortBy === 'totalTickets') {
        cmp = a.totalTickets - b.totalTickets;
      } else if (sortBy === 'totalRevenue') {
        cmp = parseFloat(a.totalRevenue) - parseFloat(b.totalRevenue);
      } else if (sortBy === 'showTitle') {
        cmp = a.showTitle.localeCompare(b.showTitle);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getExportData = async () => ({
    headers: ['Voorstelling', 'Datum', 'Rijen', 'Stoelen', 'Verkocht', 'Omzet'],
    rows: sorted.map((s) => {
      const rowLabel =
        s.minRow === null ? '-' : s.minRow === s.maxRow ? `${s.minRow}` : `${s.minRow}-${s.maxRow}`;
      const seatLabel =
        s.minSeat === null
          ? '-'
          : s.minSeat === s.maxSeat
            ? `${s.minSeat}`
            : `${s.minSeat}-${s.maxSeat}`;
      return [
        s.showTitle,
        s.performanceDate
          ? new Date(s.performanceDate).toLocaleDateString('nl-NL', { dateStyle: 'long' })
          : '-',
        rowLabel,
        seatLabel,
        s.totalSeats ? `${s.totalTickets}/${s.totalSeats}` : String(s.totalTickets),
        `€${s.totalRevenue}`,
      ];
    }),
  });

  return (
    <DataTable
      title="Verkopen per Voorstelling"
      headers={[
        { label: 'Voorstelling', sortable: true, sortKey: 'showTitle' },
        { label: 'Datum', sortable: true, sortKey: 'performanceDate' },
        { label: 'Plaatsen' },
        { label: 'Verkocht', sortable: true, sortKey: 'totalTickets', align: 'right' },
        { label: 'Omzet', sortable: true, sortKey: 'totalRevenue', align: 'right' },
      ]}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortAction={handleSort}
      filterDefinitions={FILTER_DEFINITIONS}
      filters={filters}
      onFiltersChangeAction={handleFiltersChange}
      currentPage={page}
      totalPages={totalPages}
      onPageChangeAction={setPage}
      getExportDataAction={getExportData}
    >
      {paginated.length === 0 ? (
        <EmptyRow colSpan={5} message="Geen verkopen gevonden" />
      ) : (
        paginated.map((sale) => {
          const date = sale.performanceDate ? new Date(sale.performanceDate) : null;
          const revenue = parseFloat(sale.totalRevenue);

          return (
            <Row key={sale.performanceId} className="hover:bg-zinc-50 transition-colors">
              <Column className="text-left py-3">
                <Link
                  href={`/admin/sales/shows/${sale.showId}/performances/${sale.performanceId}`}
                  className="font-medium text-zinc-900 hover:text-primary transition-colors"
                >
                  {sale.showTitle}
                </Link>
              </Column>

              <Column className="text-left py-3">
                {date ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-700">
                      {date.toLocaleDateString('nl-NL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {date.toLocaleDateString('nl-NL', { year: 'numeric' })}
                    </span>
                  </div>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </Column>

              <Column className="text-left py-3">
                <SeatRange
                  minRow={sale.minRow}
                  maxRow={sale.maxRow}
                  minSeat={sale.minSeat}
                  maxSeat={sale.maxSeat}
                />
              </Column>

              <Column className="text-right py-3">
                {sale.totalSeats ? (
                  <div className="flex justify-end">
                    <SoldBar sold={sale.totalTickets} total={sale.totalSeats} />
                  </div>
                ) : (
                  <span className="text-sm font-medium text-zinc-700">{sale.totalTickets}</span>
                )}
              </Column>

              <Column className="text-right py-3">
                <span className="text-sm font-bold text-primary tabular-nums">
                  {revenue.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' })}
                </span>
              </Column>
            </Row>
          );
        })
      )}
    </DataTable>
  );
}
