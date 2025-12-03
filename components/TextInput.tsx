import React from 'react';

interface TextInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export default function TextInput({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder = '',
  className = '',
}: TextInputProps) {
  return (
    <div className={'mb-4 ' + className}>
      <label htmlFor={name} className="block font-medium mb-1 text-primary">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full p-3 border rounded bg-surface text-accent"
      />
    </div>
  );
}
