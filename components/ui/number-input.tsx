'use client';

import * as React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange'
> {
  value?: number;
  onChange?: (value: number) => void;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      onChange,
      defaultValue = 0,
      min,
      max,
      step = 1,
      disabled,
      name,
      ...inputProps
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const decimals = step.toString().split('.')[1]?.length ?? 0;
    const formattedDefault =
      defaultValue && decimals > 0
        ? defaultValue.toFixed(decimals).replace('.', ',')
        : String(defaultValue);
    const [displayValue, setDisplayValue] = React.useState(formattedDefault);
    const [isFocused, setIsFocused] = React.useState(false);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    React.useEffect(() => {
      // Only update display value when not focused (avoid disrupting user input)
      if (!isFocused) {
        const formatted =
          decimals > 0
            ? currentValue.toFixed(decimals).replace('.', ',')
            : String(currentValue);
        setDisplayValue(formatted);
      }
    }, [currentValue, decimals, isFocused]);

    const handleValueChange = (newValue: number) => {
      if (isNaN(newValue)) return;

      const rounded = Math.round(newValue / step) * step;
      const fixedValue = Number(rounded.toFixed(decimals));

      if (!isControlled) {
        setInternalValue(fixedValue);
      }
      onChange?.(fixedValue);
    };

    const handleIncrement = () => {
      const newValue = Number(currentValue) + step;
      if (max === undefined || newValue <= max) {
        handleValueChange(newValue);
      }
    };

    const handleDecrement = () => {
      const newValue = Number(currentValue) - step;
      if (min === undefined || newValue >= min) {
        handleValueChange(newValue);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow only numbers, decimal point (. or ,), and minus sign
      const cleanedValue = inputValue.replace(/[^\d.,\-]/g, '');

      // Normalize comma to period for internal processing
      const normalizedValue = cleanedValue.replace(/,/g, '.');

      // Prevent multiple decimal points
      const parts = normalizedValue.split('.');
      const validValue =
        parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : normalizedValue;

      // Prevent multiple minus signs
      const finalValue = validValue.startsWith('--') ? validValue.substring(1) : validValue;

      // Keep display value as typed (with comma support)
      setDisplayValue(cleanedValue);

      if (finalValue === '' || finalValue === '-') {
        handleValueChange(0);
        return;
      }

      const numValue = Number.parseFloat(finalValue);
      if (!isNaN(numValue)) {
        if ((min === undefined || numValue >= min) && (max === undefined || numValue <= max)) {
          handleValueChange(numValue);
        }
      }
    };

    const handleInputBlur = () => {
      setIsFocused(false);
      // Format the display value when user leaves the field
      // Also handles negative number edge case: if only "-" was typed, it becomes "0"
      const formatted =
        decimals > 0
          ? currentValue.toFixed(decimals).replace('.', ',')
          : String(currentValue);
      setDisplayValue(formatted);
    };

    const handleInputFocus = () => {
      setIsFocused(true);
    };

    const isDecrementDisabled = disabled || (min !== undefined && currentValue <= min);
    const isIncrementDisabled = disabled || (max !== undefined && currentValue >= max);

    return (
      <div className={cn('relative inline-flex', className)}>
        {/* Hidden input stores the actual numeric value for form submission */}
        <input type="hidden" ref={ref} name={name} value={currentValue} />
        {/* Visible text input provides better UX for user typing with comma/period support */}
        <Input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          className="pr-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...inputProps}
        />
        <div className="absolute right-0 top-0 bottom-0 flex flex-col border-l">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleIncrement}
            disabled={isIncrementDisabled}
            className="h-1/2 w-7 rounded-none rounded-tr hover:bg-accent"
          >
            <ChevronUp className="h-3 w-3" />
            <span className="sr-only">Increase</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDecrement}
            disabled={isDecrementDisabled}
            className="h-1/2 w-7 rounded-none rounded-br border-t hover:bg-accent"
          >
            <ChevronDown className="h-3 w-3" />
            <span className="sr-only">Decrease</span>
          </Button>
        </div>
      </div>
    );
  },
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
