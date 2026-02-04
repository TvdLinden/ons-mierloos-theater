'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePagination } from '@/hooks/usePagination';
import Link from 'next/link';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';
import { useDebouncedValue } from '@/hooks/useDebounce';
import type { ExportData } from '@ons-mierloos-theater/shared/utils/export';

interface OrderItem {
  quantity: number;
  performance?: {
    show?: {
      title: string;
    };
  };
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  createdAt: string | null;
  totalAmount: string;
  status: string;
  lineItems: OrderItem[];
}

interface FilteredOrdersResponse {
  data: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function getExportData(
  debouncedSearchTerm: string,
  debouncedFromDate: string,
  debouncedToDate: string,
  status: string,
  sortBy: string,
  sortDir: string,
): () => Promise<ExportData> {
  return async () => {
    const params = new URLSearchParams({
      search: debouncedSearchTerm,
      fromDate: debouncedFromDate,
      toDate: debouncedToDate,
      status,
      sortBy,
      sortDir,
      page: '1',
      pageSize: '10000',
    });
    const response = await fetch(`/api/admin/orders/search?${params}`);
    if (!response.ok) throw new Error('Failed to fetch export data');
    const result: FilteredOrdersResponse = await response.json();
    return {
      headers: ['Bestelnummer', 'Klant', 'Datum', 'Items', 'Status', 'Totaal'],
      rows: result.data.map((order) => [
        order.id,
        `${order.customerName} (${order.customerEmail})`,
        order.createdAt
          ? new Date(order.createdAt).toLocaleString('nl-NL', {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          : '',
        order.lineItems
          .map((item) => `${item.quantity}x ${item.performance?.show?.title || 'Onbekend'}`)
          .join('; '),
        order.status === 'paid'
          ? 'Betaald'
          : order.status === 'pending'
            ? 'In Behandeling'
            : order.status === 'failed'
              ? 'Mislukt'
              : order.status === 'cancelled'
                ? 'Geannuleerd'
                : order.status,
        `€${order.totalAmount}`,
      ]),
    };
  };
}

export function OrderSearchClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'customerName' | 'totalAmount'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [limit] = useState(10);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { offset, setOffset, totalPages, reset: resetPage } = usePagination(total, limit);

  // Debounce the filters
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  const debouncedFromDate = useDebouncedValue(fromDate, 500);
  const debouncedToDate = useDebouncedValue(toDate, 500);

  // Fetch filtered orders from API
  const fetchFilteredOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search: debouncedSearchTerm,
        fromDate: debouncedFromDate,
        toDate: debouncedToDate,
        status,
        sortBy,
        sortDir,
        offset: offset.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`/api/admin/orders/search?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const result: FilteredOrdersResponse = await response.json();
      setFilteredOrders(result.data);
      setTotal(result.total);
      // setTotalPages handled by usePagination
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearchTerm,
    debouncedFromDate,
    debouncedToDate,
    status,
    sortBy,
    sortDir,
    offset,
    limit,
  ]);

  // Fetch when filters change
  useEffect(() => {
    resetPage(); // Reset to first page when filters change
  }, [debouncedSearchTerm, debouncedFromDate, debouncedToDate, status, sortBy, sortDir, resetPage]);

  useEffect(() => {
    fetchFilteredOrders();
  }, [fetchFilteredOrders]);

  const isFiltered = debouncedSearchTerm.trim() || debouncedFromDate || debouncedToDate || status;

  const handleSort = (newSortBy: typeof sortBy) => {
    if (newSortBy === sortBy) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDir('desc');
    }
  };

  return (
    <div className="space-y-4">
      <DataTable
        title="Recente Bestellingen"
        headers={[
          { label: 'Bestelnummer' },
          { label: 'Klant' },
          { label: 'Datum', sortable: true, sortKey: 'createdAt' },
          { label: 'Items' },
          { label: 'Status' },
          { label: 'Totaal', sortable: true, sortKey: 'totalAmount' },
        ]}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortAction={(key) => handleSort(key as typeof sortBy)}
        filters={{
          search: searchTerm,
          fromDate: fromDate,
          toDate: toDate,
          status: status,
        }}
        onFiltersChangeAction={(newFilters) => {
          if ('search' in newFilters) {
            setSearchTerm(newFilters.search as string);
          }
          if ('fromDate' in newFilters) {
            setFromDate(newFilters.fromDate as string);
          }
          if ('toDate' in newFilters) {
            setToDate(newFilters.toDate as string);
          }
          if ('status' in newFilters) {
            const statusValue = newFilters.status as string;
            setStatus(statusValue === 'all' ? '' : statusValue);
          }
        }}
        getExportDataAction={getExportData(
          debouncedSearchTerm,
          debouncedFromDate,
          debouncedToDate,
          status,
          sortBy,
          sortDir,
        )}
        filterDefinitions={[
          {
            label: 'Klant of bestelnummer',
            key: 'search',
            filterType: 'text',
          },
          {
            label: 'Van Datum',
            key: 'fromDate',
            filterType: 'date',
          },
          {
            label: 'Tot Datum',
            key: 'toDate',
            filterType: 'date',
          },
          {
            label: 'Status',
            key: 'status',
            filterType: 'select',
            filterOptions: [
              { label: 'Alle', value: 'all' },
              { label: 'Betaald', value: 'paid' },
              { label: 'In Behandeling', value: 'pending' },
              { label: 'Mislukt', value: 'failed' },
              { label: 'Geannuleerd', value: 'cancelled' },
            ],
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
            <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
              Bezig met laden...
            </td>
          </tr>
        ) : error ? (
          <tr>
            <td colSpan={6} className="px-6 py-8 text-center text-red-500">
              {error}
            </td>
          </tr>
        ) : filteredOrders.length === 0 ? (
          <EmptyRow
            colSpan={6}
            message={
              isFiltered
                ? 'Geen bestellingen gevonden met geselecteerde filters'
                : 'Nog geen bestellingen'
            }
          />
        ) : (
          filteredOrders.map((order) => (
            <tr key={order.id} className="hover:bg-zinc-50">
              <td className="px-6 py-4">
                <Link href={`/admin/sales/orders/${order.id}`}>
                  <div className="font-mono text-sm text-primary hover:underline cursor-pointer">
                    {order.id.substring(0, 8)}...
                  </div>
                </Link>
              </td>
              <td className="px-6 py-4">
                <Link href={`/admin/sales/orders/${order.id}`}>
                  <div className="font-medium text-primary hover:underline cursor-pointer">
                    {order.customerName}
                  </div>
                  <div className="text-sm text-zinc-500">{order.customerEmail}</div>
                </Link>
              </td>
              <td className="px-6 py-4 text-zinc-600 text-sm">
                {new Date(order.createdAt || '').toLocaleString('nl-NL', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm">
                  {order.lineItems.map((item, idx) => (
                    <div key={idx} className="text-zinc-600">
                      {item.quantity}x {item.performance?.show?.title || 'Onbekend'}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-zinc-100 text-zinc-800'
                  }`}
                >
                  {order.status === 'paid'
                    ? 'Betaald'
                    : order.status === 'pending'
                      ? 'In Behandeling'
                      : order.status === 'failed'
                        ? 'Mislukt'
                        : order.status === 'cancelled'
                          ? 'Geannuleerd'
                          : order.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-bold text-primary">€{order.totalAmount}</td>
            </tr>
          ))
        )}
      </DataTable>

      {isFiltered && (
        <p className="text-sm text-zinc-600">
          {filteredOrders.length} van {total} bestellingen weergegeven
        </p>
      )}
    </div>
  );
}
