'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { nl } from 'date-fns/locale/nl';
import {
  getLocaleDateTimeFormat,
  getPlaceholder,
  formatDateTime,
  parseDateString,
  applyDateTimeMask,
} from '@/lib/date-utils';

export interface DateTimePickerProps {
  /** Controlled value. When provided the component is in controlled mode. */
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  /** Initial value for uncontrolled mode. Ignored when `value` is provided. */
  defaultValue?: Date;
  locale?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  /** When set, renders a hidden `<input>` so the datetime is included in native form submissions. */
  name?: string;
  /** Format of the hidden input value. `"iso"` = full ISO string, `"local"` = `YYYY-MM-DDTHH:MM:SS`. Defaults to `"iso"`. */
  dateTimeFormat?: 'iso' | 'local';
}

export function DateTimePicker({
  value: controlledValue,
  onChange,
  defaultValue,
  locale,
  disabled,
  className,
  placeholder,
  name,
  dateTimeFormat = 'iso',
}: DateTimePickerProps) {
  const isControlled = controlledValue !== undefined;

  const [internalValue, setInternalValue] = React.useState<Date | undefined>(defaultValue);
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (date: Date | undefined) => {
    if (!isControlled) setInternalValue(date);
    onChange?.(date);
  };

  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const format = getLocaleDateTimeFormat(locale);
  const isDutch = locale === 'nl' || locale?.startsWith('nl-');

  React.useEffect(() => {
    if (value) {
      setInputValue(formatDateTime(value, locale));
    } else {
      setInputValue('');
    }
  }, [value, locale]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyDateTimeMask(e.target.value, format);
    setInputValue(masked);
    const parsed = parseDateString(masked, locale);
    if (parsed) handleChange(parsed);
  };

  const handleInputBlur = () => {
    if (inputValue) {
      const parsed = parseDateString(inputValue, locale);
      if (parsed) {
        setInputValue(formatDateTime(parsed, locale));
        handleChange(parsed);
      } else {
        setInputValue(value ? formatDateTime(value, locale) : '');
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      if (value) {
        date.setHours(value.getHours());
        date.setMinutes(value.getMinutes());
      } else {
        const now = new Date();
        date.setHours(now.getHours());
        date.setMinutes(now.getMinutes());
      }
      handleChange(date);
      setInputValue(formatDateTime(date, locale));
    }
    setOpen(false);
  };

  const handleTimeChange = (type: 'hour' | 'minute', newValue: string) => {
    const current = value ? new Date(value) : new Date();
    const num = Number.parseInt(newValue, 10);
    if (type === 'hour' && num >= 0 && num <= 23) {
      current.setHours(num);
      handleChange(current);
    } else if (type === 'minute' && num >= 0 && num <= 59) {
      current.setMinutes(num);
      handleChange(current);
    }
  };

  const hiddenValue = value
    ? dateTimeFormat === 'iso'
      ? value.toISOString()
      : `${value.toISOString().split('T')[0]}T${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}:${String(value.getSeconds()).padStart(2, '0')}`
    : '';

  return (
    <div className={cn('flex gap-2', className)}>
      <div className="relative flex-1">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder || getPlaceholder('date-time', locale)}
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
          <PopoverContent
            align="start"
            sideOffset={4}
            className="w-auto p-0 h-auto max-h-none overflow-visible"
          >
            <div className="flex flex-col">
              <div className="p-3">
                <Calendar
                  mode="single"
                  selected={value}
                  onSelect={handleCalendarSelect}
                  autoFocus
                  locale={isDutch ? nl : undefined}
                />
              </div>
              <div className="flex items-center gap-2 p-3 border-t">
                <label className="text-sm font-medium">{isDutch ? 'Tijd:' : 'Time:'}</label>
                <NumberInput
                  value={value?.getHours() ?? new Date().getHours()}
                  onChange={(val) => handleTimeChange('hour', val.toString())}
                  min={0}
                  max={23}
                  step={1}
                  className="w-20"
                />
                <span className="text-muted-foreground font-medium">:</span>
                <NumberInput
                  value={value?.getMinutes() ?? new Date().getMinutes()}
                  onChange={(val) => handleTimeChange('minute', val.toString())}
                  min={0}
                  max={59}
                  step={1}
                  className="w-20"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {name && <input type="hidden" name={name} value={hiddenValue} />}
    </div>
  );
}
