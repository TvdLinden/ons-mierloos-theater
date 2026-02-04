import { useState, useCallback } from 'react';

/**
 * Generic pagination hook for paged data.
 * @param total Total number of items
 * @param limit Items per page
 */
export function usePagination(total: number, limit: number) {
  const [offset, setOffset] = useState(0);
  const totalPages = Math.ceil(total / limit);

  const nextPage = useCallback(() => {
    setOffset((prev) => {
      if (prev + limit < total) return prev + limit;
      return prev;
    });
  }, [limit, total]);

  const prevPage = useCallback(() => {
    setOffset((prev) => {
      if (prev > 0) return Math.max(0, prev - limit);
      return prev;
    });
  }, [limit]);

  const goToPage = useCallback(
    (pageNumber: number) => {
      const newOffset = pageNumber * limit;
      if (newOffset >= 0 && newOffset < total) setOffset(newOffset);
    },
    [limit, total],
  );

  const reset = useCallback(() => setOffset(0), []);

  return { offset, setOffset, totalPages, nextPage, prevPage, goToPage, reset };
}
