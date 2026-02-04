'use client';

import { JSX, MouseEventHandler, ReactNode, useState } from 'react';
import { Button } from '../ui';
import { ExportData } from '@/lib/utils/export';
import { ExportDropdown } from './ExportDropdown';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '../ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronDown, ChevronsUpDown, ChevronUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterState = {
  [key: string]: string | boolean;
};

export type FilterDefinition = {
  label: string;
  key: string;
  filterType: 'text' | 'date' | 'select';
  filterOptions?: Array<{ label: string; value: string }>;
  placeholder?: string;
};

/**
 * Returns an array of page numbers and 'ellipsis' markers for pagination display.
 * Shows first page, last page, and a window around the current page.
 */
function getPaginationRange(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  const delta = 1; // Pages to show on each side of current
  const range: (number | 'ellipsis')[] = [];

  // For small page counts, show all pages
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  // Always include first page
  range.push(0);

  // Calculate start and end of the window around current page
  const windowStart = Math.max(1, currentPage - delta);
  const windowEnd = Math.min(totalPages - 2, currentPage + delta);

  // Add ellipsis after first page if needed
  if (windowStart > 1) {
    range.push('ellipsis');
  }

  // Add pages in the window
  for (let i = windowStart; i <= windowEnd; i++) {
    range.push(i);
  }

  // Add ellipsis before last page if needed
  if (windowEnd < totalPages - 2) {
    range.push('ellipsis');
  }

  // Always include last page
  range.push(totalPages - 1);

  return range;
}

type DataTableProps = {
  title?: string;
  headers: Array<
    | string
    | {
        label: string;
        sortable?: boolean;
        sortKey?: string;
      }
  >;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSortAction?: (sortKey: string) => void;
  children: ReactNode;
  onAddClickedAction?: MouseEventHandler<HTMLButtonElement>;
  addButtonLabel?: string;
  getExportDataAction?: () => Promise<ExportData>;
  filters?: FilterState;
  onFiltersChangeAction?: (filters: FilterState) => void;
  filterDefinitions?: FilterDefinition[];
  currentPage?: number;
  totalPages?: number;
  onPageChangeAction?: (page: number) => void;
};

export function DataTable({
  title,
  headers,
  sortBy,
  sortDir,
  onSortAction,
  children,
  onAddClickedAction,
  addButtonLabel = 'Toevoegen',
  getExportDataAction,
  filters = {},
  onFiltersChangeAction,
  filterDefinitions = [],
  currentPage = 0,
  totalPages = 1,
  onPageChangeAction,
}: DataTableProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChangeAction?.(newFilters);
  };

  return (
    <div className="bg-surface rounded-lg shadow">
      {title && (
        <div className="flex px-6 py-4 border-b border-zinc-200 items-center gap-2">
          <h2 className="text-2xl font-bold text-primary flex-1">{title}</h2>
          {filterDefinitions.length > 0 && (
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="ghost" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <h3 className="font-medium">Filters</h3>
                  {filterDefinitions.map((filterDef) => {
                    const currentValue = (filters[filterDef.key] as string) || '';

                    return (
                      <div key={filterDef.key} className="flex flex-col gap-2">
                        <label className="text-sm font-medium">{filterDef.label}</label>
                        {filterDef.filterType === 'text' && (
                          <input
                            type="text"
                            placeholder={filterDef.placeholder || `Zoeken...`}
                            value={currentValue}
                            onChange={(e) => handleFilterChange(filterDef.key, e.target.value)}
                            className="px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        )}
                        {filterDef.filterType === 'date' && (
                          <input
                            type="date"
                            value={currentValue}
                            onChange={(e) => handleFilterChange(filterDef.key, e.target.value)}
                            className="px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        )}
                        {filterDef.filterType === 'select' && filterDef.filterOptions && (
                          <Select
                            value={currentValue || filterDef.filterOptions[0].value}
                            onValueChange={(value) => handleFilterChange(filterDef.key, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecteren..." />
                            </SelectTrigger>
                            <SelectContent>
                              {filterDef.filterOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      onFiltersChangeAction?.({});
                    }}
                  >
                    Filters wissen
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {getExportDataAction && (
            <ExportDropdown
              getExportData={getExportDataAction}
              filename={title ? title.replace(/\s+/g, '_').toLowerCase() : 'export'}
            />
          )}
          {onAddClickedAction && (
            <Button type="button" className="ml-auto" onClick={onAddClickedAction}>
              {addButtonLabel}
            </Button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50">
            <tr>
              {headers.map((header, idx) => {
                if (typeof header === 'string') {
                  return (
                    <th
                      key={idx}
                      className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  );
                }
                const isSorted = sortBy === header.sortKey;
                const ariaSort = isSorted
                  ? sortDir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined;
                return (
                  <th
                    key={idx}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider select-none ${header.sortable ? 'cursor-pointer hover:text-primary' : 'text-zinc-500'}`}
                    onClick={
                      header.sortable && header.sortKey && onSortAction
                        ? () => onSortAction(header.sortKey!)
                        : undefined
                    }
                    aria-sort={ariaSort}
                  >
                    {header.label}
                    {header.sortable && header.sortKey && (
                      <span className="ml-1 inline-flex items-center">
                        {isSorted ? (
                          sortDir === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-4 w-4 opacity-30" />
                        )}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">{children}</tbody>
        </table>
      </div>
      {totalPages > 1 && onPageChangeAction && (
        <div className="flex justify-center border-t border-zinc-200 px-6 py-4">
          <Pagination>
            <PaginationContent>
              {currentPage > 0 && (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChangeAction(currentPage - 1);
                    }}
                  />
                </PaginationItem>
              )}
              {getPaginationRange(currentPage, totalPages).map((page, idx) =>
                page === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={page === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChangeAction(page);
                      }}
                    >
                      {page + 1}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              {currentPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChangeAction(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

type RowProps = { children: ReactNode } & React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLTableRowElement>,
  HTMLTableRowElement
>;

export function Row({ children, className }: RowProps) {
  return <tr className={className}>{children}</tr>;
}

type ColumnProps = { children: ReactNode; className?: string } & Omit<
  JSX.IntrinsicElements['td'],
  'className'
>;

export function Column({ children, className, ...props }: ColumnProps) {
  return (
    <td {...props} className={cn('px-6 py-8 text-center text-zinc-500', className)}>
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-8 text-center text-zinc-500">
        {message}
      </td>
    </tr>
  );
}
