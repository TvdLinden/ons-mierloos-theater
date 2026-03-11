'use client';

import { useState } from 'react';
import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { ImageSelector } from '@/components/ImageSelector';
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
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';

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

interface GalleryBlockDisplayProps {
  block: GalleryBlock;
  images?: ImageMetadata[];
}

export function GalleryBlockDisplay({ block, images = [] }: GalleryBlockDisplayProps) {
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
          {block.imageIds.map((imageId) => {
            const imageData = images.find((img) => img.id === imageId);
            return (
              <CarouselItem key={imageId} className={`basis-1/${visibleCount}`}>
                <div
                  className="relative w-full aspect-video cursor-pointer"
                  onClick={() => setFullscreenImage(imageId)}
                >
                  <Image
                    src={getImageUrl(imageId)}
                    alt="Gallery image"
                    width={width}
                    height={height}
                    className="object-cover rounded"
                    style={getFocalPointStyle(imageData?.focalPoints as any, '16:9')}
                  />
                </div>
              </CarouselItem>
            );
          })}
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
  onChange: (data: Partial<GalleryBlock>) => void;
}

export function GalleryBlockEdit({ block, onChange }: GalleryBlockEditProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <ImageSelector
        mode="multi"
        label="Galerij afbeeldingen (max 10)"
        selectedImageIds={block.imageIds}
        onSelect={(imageIds) => onChange({ imageIds })}
        maxImages={10}
        focalPointContext="16:9"
      />

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

    </div>
  );
}
interface GalleryBlockComponentProps {
  block: GalleryBlock;
  mode: 'edit' | 'display';
  onChange?: (data: Partial<GalleryBlock>) => void;
}

export function GalleryBlockComponent({ block, mode, onChange }: GalleryBlockComponentProps) {
  const [images, setImages] = React.useState<ImageMetadata[]>([]);

  // Fetch images for display mode
  React.useEffect(() => {
    if (mode === 'display') {
      const fetchImages = async () => {
        try {
          const response = await fetch('/api/images');
          if (response.ok) {
            const data = await response.json();
            setImages(data.images || []);
          }
        } catch (error) {
          console.error('Failed to fetch images:', error);
        }
      };

      fetchImages();
    }
  }, [mode]);

  if (mode === 'display') {
    return <GalleryBlockDisplay block={block} images={images} />;
  }
  return <GalleryBlockEdit block={block} onChange={onChange!} />;
}
