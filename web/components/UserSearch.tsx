'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useRef, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export default function UserSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore focus after navigation
  useEffect(() => {
    if (!isPending && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPending]);

  const debouncedSearch = useDebounce((value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      router.push(`?${params.toString()}`, { scroll: false });
    });
  }, 300);

  const handleSearch = (value: string) => {
    setSearch(value);
    debouncedSearch(value);
  };

  return (
    <div className="mb-6">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-primary
          focus:outline-none focus:ring-2 focus:ring-primary/50
          dark:bg-zinc-800 dark:border-zinc-700 dark:text-surface"
        disabled={isPending}
      />
      {isPending && <p className="mt-2 text-sm text-textSecondary">Searching...</p>}
    </div>
  );
}
