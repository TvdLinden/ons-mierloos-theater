'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';
import { ImageIcon, X } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { GalleryBlock } from '@/lib/schemas/blocks';
import type { Image as ImageType } from '@/lib/db';
import { getImageUrl } from '@/lib/utils/image-url';

interface GalleryBlockComponentProps {
  block: GalleryBlock;
  mode: 'edit' | 'display';
  availableImages?: ImageType[];
  onChange?: (data: Partial<GalleryBlock>) => void;
}

export function GalleryBlockComponent({
  block,
  mode,
  availableImages = [],
  onChange,
}: GalleryBlockComponentProps) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedImages = availableImages.filter((img) => block.imageIds.includes(img.id));

  if (mode === 'display') {
    if (selectedImages.length === 0) return null;

    const visibleCount = block.visibleImages || 1;

    return (
      <div className="my-8">
        <Carousel className="w-full" opts={{ align: 'start' }}>
          <CarouselContent>
            {selectedImages.map((image) => (
              <CarouselItem key={image.id} className={`basis-1/${visibleCount}`}>
                <div className="relative w-full aspect-video">
                  <Image src={getImageUrl(image.id)} alt="" fill className="object-contain" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        {block.caption && (
          <p className="text-center text-sm text-muted-foreground mt-2">{block.caption}</p>
        )}
      </div>
    );
  }

  const handleToggleImage = (imageId: string) => {
    const currentIds = block.imageIds || [];
    const newIds = currentIds.includes(imageId)
      ? currentIds.filter((id) => id !== imageId)
      : currentIds.length < 10
        ? [...currentIds, imageId]
        : currentIds;

    onChange?.({ imageIds: newIds });
  };

  const handleRemoveImage = (imageId: string) => {
    onChange?.({ imageIds: block.imageIds.filter((id) => id !== imageId) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Galerij afbeeldingen (max 10)</Label>
        <Button type="button" variant="outline" onClick={() => setShowPicker(true)}>
          <ImageIcon className="mr-2 h-4 w-4" />
          Selecteer afbeeldingen ({block.imageIds.length}/10)
        </Button>
      </div>

      {selectedImages.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {selectedImages.map((image) => (
            <div key={image.id} className="relative group">
              <div className="relative w-full aspect-square">
                <Image src={getImageUrl(image.id)} alt="" fill className="object-cover rounded" />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={`block-${block.id}-caption`}>Bijschrift (optioneel)</Label>
        <Input
          id={`block-${block.id}-caption`}
          value={block.caption || ''}
          onChange={(e) => onChange?.({ caption: e.target.value })}
          placeholder="Voer een bijschrift in..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`block-${block.id}-visibleImages`}>Zichtbare afbeeldingen per keer</Label>
        <NumberInput
          id={`block-${block.id}-visibleImages`}
          min={1}
          max={10}
          value={block.visibleImages || 1}
          onChange={(value) => onChange?.({ visibleImages: value })}
        />
      </div>

      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecteer afbeeldingen voor galerij</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            {availableImages.map((image) => {
              const isSelected = block.imageIds.includes(image.id);
              const canSelect = block.imageIds.length < 10 || isSelected;

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => canSelect && handleToggleImage(image.id)}
                  disabled={!canSelect}
                  className={`relative aspect-square rounded border-2 transition-all ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary'
                      : canSelect
                        ? 'border-gray-200 hover:border-primary'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Image src={getImageUrl(image.id)} alt="" fill className="object-cover rounded" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        ✓
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPicker(false)}>Klaar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
