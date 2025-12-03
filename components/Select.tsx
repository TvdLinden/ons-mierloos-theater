import React from 'react';

export type SelectOption<T extends string | number = string | number> = {
  value: T;
  label: string;
};

interface SelectProps<T extends string | number = string | number> {
  label?: string;
  name: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  className?: string;
  placeholder?: string;
}

export default function Select<T extends string | number = string | number>({
  label,
  name,
  value,
  onChange,
  options,
  className = '',
  placeholder,
}: SelectProps<T>) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    // Infer the type based on the first option's value type
    const typedValue =
      typeof options[0]?.value === 'number' ? (Number(selectedValue) as T) : (selectedValue as T);
    onChange(typedValue);
  };

  return (
    <div className={'mb-4 ' + className}>
      {label && (
        <label htmlFor={name} className="block font-medium mb-1 text-primary">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        className="w-full p-3 border rounded bg-surface text-accent"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
