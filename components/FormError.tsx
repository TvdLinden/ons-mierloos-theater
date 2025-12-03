import React from 'react';

export default function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return <div className="text-error mb-2">{error}</div>;
}
