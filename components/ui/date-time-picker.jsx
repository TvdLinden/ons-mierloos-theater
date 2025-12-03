'use client';

import * as React from 'react';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * DateTimePicker component with support for controlled, uncontrolled, and form modes
 *
 * Controlled mode:
 * <DateTimePicker value={dateTime} onValueChange={(newDateTime) => setDateTime(newDateTime)} />
 *
 * Uncontrolled mode:
 * <DateTimePicker defaultValue={new Date()} />
 *
 * Form mode (native submit):
 * <DateTimePicker defaultValue={new Date()} name="eventDateTime" />
 */
export function DateTimePicker({
  value,
  onValueChange,
  defaultValue,
  dateLabel = 'Datum',
  timeLabel = 'Tijd',
  datePlaceholder = 'Selecteer datum',
  timeStep = '1',
  defaultTime = '10:30:00',
  name,
  dateTimeFormat = 'iso',
}) {
  // Determine if component is controlled
  const isControlled = value !== undefined;

  // Internal state for uncontrolled mode
  const [internalDate, setInternalDate] = React.useState(defaultValue);
  const [internalTime, setInternalTime] = React.useState(defaultTime);

  // Use controlled or internal state
  const date = isControlled ? value?.date : internalDate;
  const time = isControlled ? value?.time : internalTime;

  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (selectedDate) => {
    if (isControlled) {
      onValueChange?.({
        date: selectedDate,
        time: value?.time || time,
      });
    } else {
      setInternalDate(selectedDate);
    }
    setOpen(false);
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    if (isControlled) {
      onValueChange?.({
        date: value?.date || date,
        time: newTime,
      });
    } else {
      setInternalTime(newTime);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="date-picker" className="px-1">
          {dateLabel}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" id="date-picker" className="w-32 justify-between font-normal">
              {date ? date.toLocaleDateString() : datePlaceholder}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              onSelect={handleDateSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="time-picker" className="px-1">
          {timeLabel}
        </Label>
        <Input
          type="time"
          id="time-picker"
          step={timeStep}
          value={time}
          onChange={handleTimeChange}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
      {/* Hidden input for form submission */}
      {name && date && (
        <input
          type="hidden"
          name={name}
          value={
            dateTimeFormat === 'iso'
              ? new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                  parseInt(time.split(':')[0]),
                  parseInt(time.split(':')[1]),
                  parseInt(time.split(':')[2]) || 0,
                ).toISOString()
              : `${date.toISOString().split('T')[0]}T${time}`
          }
        />
      )}
    </div>
  );
}
