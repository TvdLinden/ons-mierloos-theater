import React from 'react';

interface DateTimeInputProps {
  label?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
}

export default function DateTimeInput({
  label,
  name,
  value,
  defaultValue,
  onChange,
  required = false,
  className = '',
}: DateTimeInputProps) {
  return (
    <div className={'mb-4 ' + className}>
      {label && (
        <label htmlFor={name} className="block font-medium mb-1 text-primary">
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type="datetime-local"
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        required={required}
        className="w-full p-3 border rounded bg-surface text-accent"
      />
    </div>
  );
}
