export type PageItem = number | 'ellipsis';

/**
 * Returns a list of page numbers and ellipsis markers for pagination UI.
 * 1-indexed. Shows first/last page always, and a window around the current page.
 */
export function getPageNumbers(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: PageItem[] = [1];

  if (page > 3) pages.push('ellipsis');

  const rangeStart = Math.max(2, page - 1);
  const rangeEnd = Math.min(totalPages - 1, page + 1);
  for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

  if (page < totalPages - 2) pages.push('ellipsis');

  pages.push(totalPages);
  return pages;
}

/**
 * Builds a URL with a page number merged into the given query params.
 * Page 1 is omitted from the URL (canonical URL).
 */
export function buildHref(
  basePath: string,
  page: number,
  params: Record<string, string | null | undefined> = {},
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) searchParams.set(key, value);
  }
  if (page > 1) searchParams.set('page', String(page));
  const qs = searchParams.toString();
  return `${basePath}${qs ? `?${qs}` : ''}`;
}
