'use client';

import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectGroup,
  SelectValue,
} from '@/components/ui/select';

interface StatusSelectorProps {
  label?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  options: Array<{ value: string; label: string }>;
}

export default function StatusSelector({
  label,
  name,
  value,
  defaultValue,
  onChange,
  className = '',
  placeholder = 'Selecteer een status',
  options,
}: StatusSelectorProps) {
  return (
    <div className={className}>
      <Select value={value} defaultValue={defaultValue} onValueChange={onChange} name={name}>
        <SelectTrigger className="w-full max-w-48">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {label && <SelectLabel>{label}</SelectLabel>}
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
