import { getUpcomingShows, getUpcomingShowsCount, getUpcomingMonths } from '@/lib/queries/shows';
import { getAllTags } from '@/lib/queries/tags';
import PerformanceCard from '@/components/PerformanceCard';
import TagFilterClient from '@/components/TagFilterClient';
import MonthFilterClient from '@/components/MonthFilterClient';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 8;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShowsPage({ searchParams }) {
  const search = await searchParams;
  const selectedTags = search?.tags ? search.tags.split(',') : [];
  const selectedMonth = search?.month || null;
  const page = search?.page ? parseInt(search.page, 10) : 1;

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const tagFilter = selectedTags.length > 0 ? selectedTags : undefined;

  // Fetch everything in parallel
  const [tags, availableMonths, shows, totalCount] = await Promise.all([
    getAllTags(),
    getUpcomingMonths(),
    getUpcomingShows(offset, ITEMS_PER_PAGE, tagFilter, selectedMonth),
    getUpcomingShowsCount(tagFilter, selectedMonth),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Build query string helper
  const buildHref = (newPage) => {
    const params = new URLSearchParams();
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (selectedMonth) params.set('month', selectedMonth);
    if (newPage > 1) params.set('page', newPage.toString());
    return `/voorstellingen${params.toString() ? `?${params.toString()}` : ''}`;
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 6;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    // Always show first page
    pages.push(1);

    if (page > 3) pages.push('ellipsis-start');

    // Show current page and neighbors
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }

    if (page < totalPages - 2) pages.push('ellipsis-end');

    // Always show last page
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans">
      <main className="grow w-full max-w-7xl flex-col items-center justify-between py-16 px-8 mx-auto sm:items-start">
        {/* Voorstellingen Sectie */}
        <section id="performances" className="w-full mb-12">
          <h1 className="text-5xl font-bold text-center text-primary mb-10 font-serif">
            Voorstellingen
          </h1>

          {/* Tag Filter */}
          {tags && tags.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-semibold text-foreground mb-3">Filter op categorie:</p>
              <TagFilterClient tags={tags} selectedTags={selectedTags} />
            </div>
          )}

          {/* Month Filter */}
          {availableMonths.length > 0 && (
            <div className="mb-8">
              <p className="text-sm font-semibold text-foreground mb-3">Filter op maand:</p>
              <MonthFilterClient availableMonths={availableMonths} selectedMonth={selectedMonth} />
            </div>
          )}

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {shows.length === 0 ? (
              <div className="text-center text-primary/70">
                Er zijn momenteel geen voorstellingen beschikbaar.
              </div>
            ) : (
              shows.map((performance) => (
                <PerformanceCard key={performance.id} show={performance} tags={performance.tags} />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    {page > 1 ? (
                      <PaginationPrevious href={buildHref(page - 1)} />
                    ) : (
                      <PaginationPrevious
                        href="#"
                        className="pointer-events-none opacity-50"
                        aria-disabled="true"
                      />
                    )}
                  </PaginationItem>

                  {getPageNumbers().map((pageNum, idx) => {
                    if (pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end') {
                      return (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink href={buildHref(pageNum)} isActive={pageNum === page}>
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    {page < totalPages ? (
                      <PaginationNext href={buildHref(page + 1)} />
                    ) : (
                      <PaginationNext
                        href="#"
                        className="pointer-events-none opacity-50"
                        aria-disabled="true"
                      />
                    )}
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
