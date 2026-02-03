'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type MonthFilterClientProps = {
  availableMonths: string[]; // ["2026-02", "2026-03"]
  selectedMonth: string | null;
};

export default function MonthFilterClient({
  availableMonths,
  selectedMonth,
}: MonthFilterClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMonthChange = (month: string | null) => {
    const params = new URLSearchParams(searchParams);

    if (month) {
      params.set('month', month);
    } else {
      params.delete('month');
    }
    params.delete('page'); // Reset pagination when filter changes

    const newUrl = params.toString() ? `/voorstellingen?${params.toString()}` : '/voorstellingen';
    router.push(newUrl);
  };

  // Only show year when months span multiple years
  const years = new Set(availableMonths.map((m) => m.split('-')[0]));
  const showYear = years.size > 1;

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const name = date.toLocaleString('nl-NL', { month: 'long' });
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return showYear ? `${capitalized} ${year}` : capitalized;
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <button
        onClick={() => handleMonthChange(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !selectedMonth
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground hover:bg-muted/80'
        }`}
      >
        Alle
      </button>

      {availableMonths.map((month) => (
        <button
          key={month}
          onClick={() => handleMonthChange(month)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedMonth === month
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {formatMonth(month)}
        </button>
      ))}
    </div>
  );
}
