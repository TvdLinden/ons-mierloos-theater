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
        <div className="relative w-full aspect-video mt-2 rounded border overflow-hidden max-h-48">
          <Image
            src={previewUrl}
            alt="Preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 500px"
          />
        </div>
      )}
    </div>
  );
}
