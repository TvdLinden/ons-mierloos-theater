'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePagination } from '@/hooks/usePagination';
import Link from 'next/link';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';
import { useDebouncedValue } from '@/hooks/useDebounce';
import { Button } from '@/components/ui';
import type { ExportData } from '@/lib/utils/export';
import type { ShowWithTagsAndPerformances } from '@/lib/db';

interface FilteredShowsResponse {
  data: ShowWithTagsAndPerformances[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ShowsTableClientProps {
  onStatusChange: (id: string, targetStatus: 'published' | 'draft') => Promise<void>;
}

function getExportData(
  debouncedSearch: string,
  status: string,
  publicationFrom: string,
  publicationTo: string,
  depublicationFrom: string,
  depublicationTo: string,
  sortBy: string,
  sortDir: string,
): () => Promise<ExportData> {
  return async () => {
    const params = new URLSearchParams({
      search: debouncedSearch,
      status,
      publicationFrom,
      publicationTo,
      depublicationFrom,
      depublicationTo,
      sortBy,
      sortDir,
      offset: '0',
      limit: '10000',
    });
    const response = await fetch(`/api/admin/shows/search?${params}`);
    if (!response.ok) throw new Error('Failed to fetch export data');
    const result: FilteredShowsResponse = await response.json();
    return {
      headers: ['Titel', 'Ondertitel', 'Prijs', 'Status', 'Publicatiedatum', 'Depublicatiedatum'],
      rows: result.data.map((show) => [
        show.title,
        show.subtitle || '',
        `€${show.basePrice || '0.00'}`,
        show.status === 'published' ? 'Gepubliceerd' : 'Concept',
        show.publicationDate ? new Date(show.publicationDate).toLocaleDateString('nl-NL') : '',
        show.depublicationDate ? new Date(show.depublicationDate).toLocaleDateString('nl-NL') : '',
      ]),
    };
  };
}

export function ShowsTableClient({ onStatusChange }: ShowsTableClientProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [publicationFrom, setPublicationFrom] = useState('');
  const [publicationTo, setPublicationTo] = useState('');
  const [depublicationFrom, setDepublicationFrom] = useState('');
  const [depublicationTo, setDepublicationTo] = useState('');
  const [sortBy, setSortBy] = useState<
    'title' | 'publicationDate' | 'depublicationDate' | 'basePrice'
  >('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [limit] = useState(10);
  const [shows, setShows] = useState<ShowWithTagsAndPerformances[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { offset, setOffset, totalPages, reset: resetPage } = usePagination(total, limit);

  // Debounce the search filter
  const debouncedSearch = useDebouncedValue(search, 500);
  const debouncedPublicationFrom = useDebouncedValue(publicationFrom, 500);
  const debouncedPublicationTo = useDebouncedValue(publicationTo, 500);
  const debouncedDepublicationFrom = useDebouncedValue(depublicationFrom, 500);
  const debouncedDepublicationTo = useDebouncedValue(depublicationTo, 500);

  // Fetch filtered shows
  const fetchShows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search: debouncedSearch,
        status,
        publicationFrom: debouncedPublicationFrom,
        publicationTo: debouncedPublicationTo,
        depublicationFrom: debouncedDepublicationFrom,
        depublicationTo: debouncedDepublicationTo,
        sortBy,
        sortDir,
        offset: offset.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/admin/shows/search?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch shows');
      }

      const result: FilteredShowsResponse = await response.json();
      setShows(result.data);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setShows([]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    status,
    debouncedPublicationFrom,
    debouncedPublicationTo,
    debouncedDepublicationFrom,
    debouncedDepublicationTo,
    sortBy,
    sortDir,
    offset,
    limit,
  ]);

  // Reset page when filters change
  useEffect(() => {
    resetPage();
  }, [
    debouncedSearch,
    status,
    debouncedPublicationFrom,
    debouncedPublicationTo,
    debouncedDepublicationFrom,
    debouncedDepublicationTo,
    sortBy,
    sortDir,
    resetPage,
  ]);

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  const handleSort = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDir('asc');
    }
  };

  const handleStatusToggle = async (id: string, targetStatus: 'published' | 'draft') => {
    setActionLoading(id);
    try {
      await onStatusChange(id, targetStatus);
      await fetchShows();
    } finally {
      setActionLoading(null);
    }
  };

  const isFiltered =
    debouncedSearch ||
    status ||
    debouncedPublicationFrom ||
    debouncedPublicationTo ||
    debouncedDepublicationFrom ||
    debouncedDepublicationTo;

  return (
    <div className="space-y-4">
      <DataTable
        title="Voorstellingen"
        headers={[
          { label: 'Titel', sortable: true, sortKey: 'title' },
          'Ondertitel',
          { label: 'Prijs', sortable: true, sortKey: 'basePrice' },
          'Status',
          { label: 'Publicatiedatum', sortable: true, sortKey: 'publicationDate' },
          { label: 'Depublicatiedatum', sortable: true, sortKey: 'depublicationDate' },
          'Acties',
        ]}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortAction={(key) => handleSort(key as typeof sortBy)}
        filters={{
          search,
          status,
          publicationFrom,
          publicationTo,
          depublicationFrom,
          depublicationTo,
        }}
        onFiltersChangeAction={(newFilters) => {
          // Empty object means clear all filters
          if (Object.keys(newFilters).length === 0) {
            setSearch('');
            setStatus('');
            setPublicationFrom('');
            setPublicationTo('');
            setDepublicationFrom('');
            setDepublicationTo('');
            return;
          }
          if ('search' in newFilters) setSearch(newFilters.search as string);
          if ('status' in newFilters) {
            const val = newFilters.status as string;
            setStatus(val === 'all' ? '' : val);
          }
          if ('publicationFrom' in newFilters)
            setPublicationFrom(newFilters.publicationFrom as string);
          if ('publicationTo' in newFilters) setPublicationTo(newFilters.publicationTo as string);
          if ('depublicationFrom' in newFilters)
            setDepublicationFrom(newFilters.depublicationFrom as string);
          if ('depublicationTo' in newFilters)
            setDepublicationTo(newFilters.depublicationTo as string);
        }}
        getExportDataAction={getExportData(
          debouncedSearch,
          status,
          debouncedPublicationFrom,
          debouncedPublicationTo,
          debouncedDepublicationFrom,
          debouncedDepublicationTo,
          sortBy,
          sortDir,
        )}
        filterDefinitions={[
          {
            label: 'Titel of ondertitel',
            key: 'search',
            filterType: 'text',
          },
          {
            label: 'Status',
            key: 'status',
            filterType: 'select',
            filterOptions: [
              { label: 'Alle', value: 'all' },
              { label: 'Gepubliceerd', value: 'published' },
              { label: 'Concept', value: 'draft' },
            ],
          },
          {
            label: 'Publicatie vanaf',
            key: 'publicationFrom',
            filterType: 'date',
          },
          {
            label: 'Publicatie tot',
            key: 'publicationTo',
            filterType: 'date',
          },
        ]}
        currentPage={offset / limit}
        totalPages={totalPages}
        onPageChangeAction={(pageNum) => {
          setOffset(pageNum * limit);
        }}
      >
        {loading ? (
          <tr>
            <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
              Bezig met laden...
            </td>
          </tr>
        ) : error ? (
          <tr>
            <td colSpan={7} className="px-6 py-8 text-center text-red-500">
              {error}
            </td>
          </tr>
        ) : shows.length === 0 ? (
          <EmptyRow
            colSpan={7}
            message={
              isFiltered
                ? 'Geen voorstellingen gevonden met geselecteerde filters'
                : 'Nog geen voorstellingen'
            }
          />
        ) : (
          shows.map((show) => {
            const isPublished = show.status === 'published';
            const actionLabel = isPublished ? 'Maak concept' : 'Publiceer';
            const targetStatus = isPublished ? 'draft' : 'published';
            const publicationDate = show.publicationDate
              ? new Date(show.publicationDate).toLocaleDateString('nl-NL')
              : '-';
            const depublicationDate = show.depublicationDate
              ? new Date(show.depublicationDate).toLocaleDateString('nl-NL')
              : '-';

            return (
              <tr key={show.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4">
                  <Link href={`/admin/shows/${show.id}`}>
                    <div className="font-medium text-primary hover:underline cursor-pointer">
                      {show.title}
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-zinc-600 text-sm">{show.subtitle || '-'}</td>
                <td className="px-6 py-4 text-zinc-600 text-sm">
                  &euro;{show.basePrice || '0.00'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${
                      isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {isPublished ? 'Gepubliceerd' : 'Concept'}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-600 text-sm">{publicationDate}</td>
                <td className="px-6 py-4 text-zinc-600 text-sm">{depublicationDate}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link href={`/admin/shows/edit/${show.id}`}>
                      <Button type="button" variant="default">
                        Bewerken
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={actionLoading === show.id}
                      onClick={() => handleStatusToggle(show.id, targetStatus)}
                    >
                      {actionLoading === show.id ? 'Bezig...' : actionLabel}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </DataTable>

      {isFiltered && (
        <p className="text-sm text-zinc-600">
          {shows.length} van {total} voorstellingen weergegeven
        </p>
      )}
    </div>
  );
}
