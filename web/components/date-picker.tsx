'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
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

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  locale?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  locale = 'nl',
  disabled,
  className,
  placeholder,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const format = getLocaleDateFormat(locale);

  // Update input value when prop value changes
  React.useEffect(() => {
    if (value) {
      setInputValue(formatDate(value, locale));
    } else {
      setInputValue('');
    }
  }, [value, locale]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const masked = applyDateMask(rawValue, format);
    setInputValue(masked);

    // Try to parse the date
    const parsed = parseDateString(masked, locale);
    if (parsed) {
      onChange?.(parsed);
    }
  };

  const handleInputBlur = () => {
    // Validate and reformat on blur
    if (inputValue) {
      const parsed = parseDateString(inputValue, locale);
      if (parsed) {
        setInputValue(formatDate(parsed, locale));
        onChange?.(parsed);
      } else {
        // Invalid date, clear or revert
        setInputValue(value ? formatDate(value, locale) : '');
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange?.(date);
    if (date) {
      setInputValue(formatDate(date, locale));
    }
    setOpen(false);
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <div className="relative flex-1">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder || format}
          disabled={disabled}
          className="pr-10"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={value} onSelect={handleCalendarSelect} initialFocus />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
