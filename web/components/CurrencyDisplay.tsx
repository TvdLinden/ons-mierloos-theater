import React from 'react';

export default function CurrencyDisplay({
  value,
  locale = 'nl-NL',
  currency = 'EUR',
}: {
  value: string | number;
  locale?: string;
  currency?: string;
}) {
  const number = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(number)) return null;
  return (
    <span>{new Intl.NumberFormat(locale, { style: 'currency', currency }).format(number)}</span>
  );
}
