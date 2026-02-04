import React from 'react';

interface TextareaProps {
  label?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export default function Textarea({
  label,
  name,
  value,
  defaultValue,
  onChange,
  required = false,
  placeholder = '',
  className = '',
  rows = 4,
}: TextareaProps) {
  return (
    <div className={'mb-4 ' + className}>
      {label && (
        <label htmlFor={name} className="block font-medium mb-1 text-primary">
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full p-3 border rounded bg-surface text-accent"
        rows={rows}
      />
    </div>
  );
}
