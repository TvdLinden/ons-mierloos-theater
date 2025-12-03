import React from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  helperText,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block font-semibold text-primary">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {helperText && <p className="text-sm text-gray-600">{helperText}</p>}
      {children}
      {error && <p className="text-error text-sm mt-1">{error}</p>}
    </div>
  );
}
