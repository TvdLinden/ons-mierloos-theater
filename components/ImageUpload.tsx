import Image from 'next/image';
import React from 'react';

interface ImageUploadProps {
  label: string;
  name: string;
  onChange: (file: File | null) => void;
  previewUrl?: string;
  className?: string;
}

export default function ImageUpload({
  label,
  name,
  onChange,
  previewUrl,
  className = '',
}: ImageUploadProps) {
  return (
    <div className={'mb-4 ' + className}>
      <label htmlFor={name} className="block font-medium mb-1 text-primary">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="w-full p-3 border rounded bg-surface text-accent"
      />
      {previewUrl && (
        <Image
          src={previewUrl}
          alt="Preview"
          className="mt-2 rounded border w-full max-h-48 object-cover"
        />
      )}
    </div>
  );
}
