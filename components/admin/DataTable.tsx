'use client';

import { JSX, MouseEventHandler, ReactNode, useRef, useState } from 'react';
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
} from '../ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronDown, ChevronsUpDown, ChevronUp, Filter } from 'lucide-react';

type FilterState = {
  [key: string]: string | boolean;
};

type FilterDefinition = {
  label: string;
  key: string;
  filterType: 'text' | 'date' | 'select';
  filterOptions?: Array<{ label: string; value: string }>;
};

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
  emptyMessage?: string;
  onAddClickedAction?: MouseEventHandler<HTMLButtonElement>;
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
  getExportDataAction,
  filters = {},
  onFiltersChangeAction,
  filterDefinitions = [],
  currentPage = 0,
  totalPages = 1,
  onPageChangeAction,
}: DataTableProps) {
  const tableRef = useRef<HTMLTableElement>(null);
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
                            placeholder={`Filter by ${filterDef.label.toLowerCase()}`}
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
              Add
            </Button>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full" ref={tableRef}>
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
                return (
                  <th
                    key={idx}
                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider select-none ${header.sortable ? 'cursor-pointer hover:text-primary' : 'text-zinc-500'}`}
                    onClick={
                      header.sortable && header.sortKey && onSortAction
                        ? () => onSortAction(header.sortKey!)
                        : undefined
                    }
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
              {Array.from({ length: totalPages }, (_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    isActive={i === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChangeAction(i);
                    }}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
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

type ColumnProps = { children: ReactNode } & JSX.IntrinsicElements['td'];

export function Column({ children, ...props }: ColumnProps) {
  return (
    <td {...props} className="px-6 py-8 text-center text-zinc-500">
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
