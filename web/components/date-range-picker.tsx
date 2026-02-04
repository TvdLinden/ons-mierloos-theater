'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import {
  getLocaleDateFormat,
  getPlaceholder,
  formatDate,
  parseDateString,
  applyDateMask,
} from '@/lib/date-utils';

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  locale?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  locale,
  disabled,
  className,
  placeholder,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [startInput, setStartInput] = React.useState('');
  const [endInput, setEndInput] = React.useState('');
  const format = getLocaleDateFormat(locale);

  // Update inputs when prop value changes
  React.useEffect(() => {
    setStartInput(value?.from ? formatDate(value.from, locale) : '');
    setEndInput(value?.to ? formatDate(value.to, locale) : '');
  }, [value, locale]);

  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const masked = applyDateMask(rawValue, format);
    setStartInput(masked);

    const parsed = parseDateString(masked, locale);
    if (parsed) {
      onChange?.({
        from: parsed,
        to: value?.to,
      });
    }
  };

  const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const masked = applyDateMask(rawValue, format);
    setEndInput(masked);

    const parsed = parseDateString(masked, locale);
    if (parsed) {
      onChange?.({
        from: value?.from,
        to: parsed,
      });
    }
  };

  const handleStartInputBlur = () => {
    if (startInput) {
      const parsed = parseDateString(startInput, locale);
      if (parsed) {
        setStartInput(formatDate(parsed, locale));
      } else {
        setStartInput(value?.from ? formatDate(value.from, locale) : '');
      }
    }
  };

  const handleEndInputBlur = () => {
    if (endInput) {
      const parsed = parseDateString(endInput, locale);
      if (parsed) {
        setEndInput(formatDate(parsed, locale));
      } else {
        setEndInput(value?.to ? formatDate(value.to, locale) : '');
      }
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    onChange?.(range);
    if (range?.from && range?.to) {
      setStartInput(formatDate(range.from, locale));
      setEndInput(formatDate(range.to, locale));
      setOpen(false);
    }
  };

  const formattedRange = React.useMemo(() => {
    if (!value?.from) return placeholder || 'Select date range';
    if (!value.to) return formatDate(value.from, locale);
    return `${formatDate(value.from, locale)} - ${formatDate(value.to, locale)}`;
  }, [value, locale, placeholder]);

  return (
    <div className={cn('flex gap-2', className)}>
      <div className="flex-1 flex gap-2">
        <Input
          value={startInput}
          onChange={handleStartInputChange}
          onBlur={handleStartInputBlur}
          placeholder={`Start: ${getPlaceholder(format)}`}
          disabled={disabled}
          className="flex-1"
        />
        <Input
          value={endInput}
          onChange={handleEndInputChange}
          onBlur={handleEndInputBlur}
          placeholder={`End: ${getPlaceholder(format)}`}
          disabled={disabled}
          className="flex-1"
        />
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal min-w-[240px]',
              !value && 'text-muted-foreground',
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formattedRange}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
