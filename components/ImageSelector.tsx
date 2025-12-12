'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageIcon, X } from 'lucide-react';

interface ImageSelectorProps {
  label: string;
  selectedImageId: string | null;
  availableImages: Array<{ id: string; filename: string | null }>;
  onSelect: (imageId: string | null) => void;
  imageSize?: 'small' | 'medium' | 'large';
}

export function ImageSelector({
  label,
  selectedImageId,
  availableImages,
  onSelect,
  imageSize = 'medium',
}: ImageSelectorProps) {
  const [showPicker, setShowPicker] = useState(false);

  const sizeMap = {
    small: { container: 'w-16 h-16', grid: 'grid-cols-3' },
    medium: { container: 'w-32 h-32', grid: 'grid-cols-4' },
    large: { container: 'w-48 h-48', grid: 'grid-cols-5' },
  };

  const { container, grid } = sizeMap[imageSize];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {selectedImageId ? (
        <div className="relative inline-block mt-2">
          <div className={`relative ${container} border rounded overflow-hidden`}>
            <Image
              src={`/api/images/${selectedImageId}`}
              alt={label}
              fill
              className="object-contain"
              sizes="200px"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2"
            onClick={() => onSelect(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <Button type="button" variant="outline" onClick={() => setShowPicker(!showPicker)}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Selecteer Afbeelding
          </Button>

          {showPicker && (
            <div className="mt-4 border rounded-lg p-4 max-h-64 overflow-y-auto bg-card">
              <div className={`grid ${grid} gap-2`}>
                {availableImages.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    className="relative aspect-square border rounded hover:border-primary transition-colors"
                    onClick={() => {
                      onSelect(img.id);
                      setShowPicker(false);
                    }}
                  >
                    <Image
                      src={`/api/images/${img.id}`}
                      alt={img.filename || 'Afbeelding'}
                      fill
                      className="object-cover rounded"
                      sizes="100px"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                onClick={() => setShowPicker(false)}
              >
                Sluiten
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
