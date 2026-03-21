'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { getPageNumbers } from '@/lib/utils/pagination';

type HrefMode = {
  /** Called with the target page number; should return the href string. */
  buildHref: (page: number) => string;
  onPageChange?: never;
};

type CallbackMode = {
  /** Called with the target page number for client-side navigation. */
  onPageChange: (page: number) => void;
  buildHref?: never;
};

type PaginationBarProps = {
  page: number;
  totalPages: number;
  disabled?: boolean;
} & (HrefMode | CallbackMode);

export default function PaginationBar({
  page,
  totalPages,
  disabled,
  buildHref,
  onPageChange,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const hrefFor = buildHref ?? ((p: number) => `?page=${p}`);

  const linkProps = (targetPage: number) =>
    onPageChange
      ? {
          href: '#',
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            if (!disabled) onPageChange(targetPage);
          },
        }
      : { href: hrefFor(targetPage) };

  const prevDisabled = disabled || page <= 1;
  const nextDisabled = disabled || page >= totalPages;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            {...(prevDisabled ? { href: '#' } : linkProps(page - 1))}
            aria-disabled={prevDisabled}
            className={prevDisabled ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>

        {getPageNumbers(page, totalPages).map((item, idx) =>
          item === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink {...linkProps(item)} isActive={item === page}>
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            {...(nextDisabled ? { href: '#' } : linkProps(page + 1))}
            aria-disabled={nextDisabled}
            className={nextDisabled ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
