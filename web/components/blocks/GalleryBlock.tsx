'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ImageIcon, X, ChevronDown } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { getImageUrl } from '@ons-mierloos-theater/shared/utils/image-url';

import type { GalleryBlock } from '@ons-mierloos-theater/shared/schemas/blocks';
import type { ImageMetadata } from '@ons-mierloos-theater/shared/db';

function FullscreenImageDialog({
  imageId,
  onClose,
}: {
  imageId: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!imageId} onOpenChange={onClose}>
      <DialogTitle hidden>Afbeelding bekijken</DialogTitle>
      <DialogContent className="p-0 border border-transparent bg-transparent">
        {imageId && (
          <div className="relative">
            <Image
              src={getImageUrl(imageId)}
              alt="Fullscreen image"
              width={1600}
              height={900}
              className="object-contain"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function GalleryBlockDisplay({ block }: { block: GalleryBlock }) {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const sizes = {
    xs: [100, 56],
    sm: [200, 112],
    md: [400, 225],
    lg: [800, 450],
    xl: [1200, 675],
  };
  const [width, height] = sizes[block.imageSize || 'md'];

  if (block.imageIds.length === 0) return null;
  const visibleCount = block.visibleImages || 1;

  return (
    <div className="my-8 w-full max-w-[65ch]">
      <Carousel className="w-full" opts={{ align: 'start' }}>
        <CarouselContent>
          {block.imageIds.map((imageId) => (
            <CarouselItem key={imageId} className={`basis-1/${visibleCount}`}>
              <div
                className="relative w-full aspect-video cursor-pointer"
                onClick={() => setFullscreenImage(imageId)}
              >
                <Image
                  src={getImageUrl(imageId)} // Use 'sm' size for thumbnails
                  alt="Gallery image"
                  width={width}
                  height={height}
                  className="object-cover rounded"
                />
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

      {/* Fullscreen Dialog */}
      <FullscreenImageDialog imageId={fullscreenImage} onClose={() => setFullscreenImage(null)} />
    </div>
  );
}

// Edit-only component
interface GalleryBlockEditProps {
  block: GalleryBlock;
  availableImages: ImageMetadata[];
  onChange: (data: Partial<GalleryBlock>) => void;
}

export function GalleryBlockEdit({ block, availableImages, onChange }: GalleryBlockEditProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const selectedImages = availableImages.filter((img) => block.imageIds.includes(img.id));

  const handleToggleImage = (imageId: string) => {
    const currentIds = block.imageIds || [];
    const newIds = currentIds.includes(imageId)
      ? currentIds.filter((id) => id !== imageId)
      : currentIds.length < 10
        ? [...currentIds, imageId]
        : currentIds;
    onChange({ imageIds: newIds });
  };

  const handleRemoveImage = (imageId: string) => {
    onChange({ imageIds: block.imageIds.filter((id) => id !== imageId) });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Galerij afbeeldingen (max 10)</Label>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowPicker(true)}
          aria-label="Selecteer afbeeldingen voor galerij"
          className="w-full"
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Selecteer afbeeldingen ({block.imageIds.length}/10)
        </Button>
      </div>

      {selectedImages.length > 0 && (
        <div className="grid grid-cols-5 gap-2">
          {selectedImages.map((image) => (
            <div key={image.id} className="relative group">
              <div className="relative w-full aspect-square">
                <Image
                  src={getImageUrl(image.id, 'sm')}
                  alt="Selected image preview"
                  fill
                  className="object-cover rounded"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(image.id)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Verwijder afbeelding"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="w-full justify-between">
            Geavanceerde instellingen
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 pt-3">
          <div>
            <Label htmlFor={`block-${block.id}-caption`}>Bijschrift (optioneel)</Label>
            <Input
              id={`block-${block.id}-caption`}
              value={block.caption || ''}
              onChange={(e) => onChange({ caption: e.target.value })}
              placeholder="Voer een bijschrift in..."
              aria-label="Bijschrift voor galerij"
            />
          </div>

          <div>
            <Label htmlFor={`block-${block.id}-imageSize`}>Afbeeldingsgrootte</Label>
            <Select
              value={block.imageSize || 'md'}
              onValueChange={(value) => onChange({ imageSize: value as GalleryBlock['imageSize'] })}
            >
              <SelectTrigger id={`block-${block.id}-imageSize`}>
                <SelectValue placeholder="Kies grootte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xs">Extra Klein</SelectItem>
                <SelectItem value="sm">Klein</SelectItem>
                <SelectItem value="md">Middel</SelectItem>
                <SelectItem value="lg">Groot</SelectItem>
                <SelectItem value="xl">Extra Groot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`block-${block.id}-visibleImages`}>
              Zichtbare afbeeldingen per keer
            </Label>
            <NumberInput
              id={`block-${block.id}-visibleImages`}
              min={1}
              max={10}
              value={block.visibleImages || 1}
              onChange={(value) => onChange({ visibleImages: value })}
              aria-label="Aantal zichtbare afbeeldingen per keer"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

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
                  aria-label={
                    isSelected
                      ? `Afbeelding geselecteerd: ${image.id}`
                      : `Selecteer afbeelding: ${image.id}`
                  }
                >
                  <Image
                    src={getImageUrl(image.id)}
                    alt="Beschikbare afbeelding"
                    fill
                    className="object-cover rounded"
                  />
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
interface GalleryBlockComponentProps {
  block: GalleryBlock;
  mode: 'edit' | 'display';
  availableImages?: ImageMetadata[];
  onChange?: (data: Partial<GalleryBlock>) => void;
}

export function GalleryBlockComponent({
  block,
  mode,
  availableImages = [],
  onChange,
}: GalleryBlockComponentProps) {
  if (mode === 'display') {
    return <GalleryBlockDisplay block={block} />;
  }
  return <GalleryBlockEdit block={block} availableImages={availableImages} onChange={onChange!} />;
}
