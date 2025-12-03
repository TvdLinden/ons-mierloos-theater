'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * DatePicker component with support for controlled, uncontrolled, and form modes
 *
 * Controlled mode:
 * <DatePicker value={date} onValueChange={(newDate) => setDate(newDate)} />
 *
 * Uncontrolled mode:
 * <DatePicker defaultValue={new Date()} />
 *
 * Form mode (native submit):
 * <DatePicker defaultValue={new Date()} name="birthDate" />
 */
export function DatePicker({
  value,
  onValueChange,
  defaultValue,
  label = 'Datum',
  placeholder = 'Selecteer datum',
  disabled = false,
  id = 'date-picker',
  name,
}) {
  // Determine if component is controlled
  const isControlled = value !== undefined;

  // Internal state for uncontrolled mode
  const [internalDate, setInternalDate] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);

  // Use controlled or internal state
  const date = isControlled ? value : internalDate;

  const handleDateSelect = (selectedDate) => {
    if (isControlled) {
      onValueChange?.(selectedDate);
    } else {
      setInternalDate(selectedDate);
    }
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            disabled={disabled}
            className="w-32 justify-between font-normal"
          >
            {date ? date.toLocaleDateString() : placeholder}
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={handleDateSelect}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
      {/* Hidden input for form submission */}
      {name && (
        <input type="hidden" name={name} value={date ? date.toISOString().split('T')[0] : ''} />
      )}
    </div>
  );
}
