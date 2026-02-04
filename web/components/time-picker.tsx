'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { getLocaleTimeFormat, formatTime, parseTimeString, applyTimeMask } from '@/lib/date-utils';

export interface TimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function TimePicker({ value, onChange, disabled, className, placeholder }: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const format = getLocaleTimeFormat();

  // Update input value when prop value changes
  React.useEffect(() => {
    if (value) {
      setInputValue(formatTime(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const masked = applyTimeMask(rawValue);
    setInputValue(masked);

    // Try to parse the time
    const parsed = parseTimeString(masked);
    if (parsed) {
      const newDate = value ? new Date(value) : new Date();
      newDate.setHours(parsed.hours);
      newDate.setMinutes(parsed.minutes);
      onChange?.(newDate);
    }
  };

  const handleInputBlur = () => {
    // Validate and reformat on blur
    if (inputValue) {
      const parsed = parseTimeString(inputValue);
      if (parsed) {
        const newDate = value ? new Date(value) : new Date();
        newDate.setHours(parsed.hours);
        newDate.setMinutes(parsed.minutes);
        setInputValue(formatTime(newDate));
        onChange?.(newDate);
      } else {
        // Invalid time, clear or revert
        setInputValue(value ? formatTime(value) : '');
      }
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', newValue: string) => {
    const current = value || new Date();
    const num = Number.parseInt(newValue, 10);

    if (type === 'hour' && num >= 0 && num <= 23) {
      current.setHours(num);
      onChange?.(new Date(current));
    } else if (type === 'minute' && num >= 0 && num <= 59) {
      current.setMinutes(num);
      onChange?.(new Date(current));
    }
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
              <Clock className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Time</label>
              <div className="flex items-center gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Hours</label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={value?.getHours() ?? new Date().getHours()}
                    onChange={(e) => handleTimeChange('hour', e.target.value)}
                    className="w-20 text-center"
                    placeholder="HH"
                  />
                </div>
                <span className="text-2xl text-muted-foreground mt-5">:</span>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Minutes</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={value?.getMinutes() ?? new Date().getMinutes()}
                    onChange={(e) => handleTimeChange('minute', e.target.value)}
                    className="w-20 text-center"
                    placeholder="mm"
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  const now = new Date();
                  onChange?.(now);
                  setOpen(false);
                }}
              >
                Now
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
