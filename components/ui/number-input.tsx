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
    { className, value, onChange, defaultValue = 0, min, max, step = 1, disabled, ...props },
    ref,
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const decimals = step.toString().split('.')[1]?.length ?? 0;

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const handleValueChange = (newValue: number) => {
      if (isNaN(newValue)) return;

      const rounded = Math.round(newValue / step) * step;
      const fixedValue = Number(rounded.toFixed(decimals));

      if (!isControlled) {
        // new value should be fixed to step precision

        // new value should be fixed to step precision
        // 34.160000000000004 issue fix - step size 0.01
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
      if (inputValue === '' || inputValue === '-') {
        handleValueChange(0);
        return;
      }

      const numValue = Number.parseFloat(inputValue);
      if (!isNaN(numValue)) {
        if ((min === undefined || numValue >= min) && (max === undefined || numValue <= max)) {
          handleValueChange(numValue);
        }
      }
    };

    const isDecrementDisabled = disabled || (min !== undefined && currentValue <= min);
    const isIncrementDisabled = disabled || (max !== undefined && currentValue >= max);

    return (
      <div className={cn('relative inline-flex', className)}>
        <Input
          ref={ref}
          type="number"
          value={currentValue}
          onChange={handleInputChange}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className="pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          {...props}
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
