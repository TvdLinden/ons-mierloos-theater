'use client';

import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageSelector } from '@/components/ImageSelector';
import type { ImageBlock } from '@/lib/schemas/blocks';
import type { ImageMetadata } from '@/lib/db';
import { getImageUrl } from '@/lib/utils/image-url';

export function ImageBlockDisplay({ block }: { block: ImageBlock }) {
  if (!block.imageId) return null;
  return (
    <div className="my-8 w-full max-w-[65ch]">
      <div className="relative w-full aspect-video">
        <Image
          src={getImageUrl(block.imageId)}
          alt={block.alt || block.caption || ''}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 65ch"
        />
      </div>
      {block.caption && (
        <p className="text-center text-sm text-muted-foreground mt-2">{block.caption}</p>
      )}
    </div>
  );
}

// Edit-only component
interface ImageBlockEditProps {
  block: ImageBlock;
  availableImages: ImageMetadata[];
  onChange: (data: Partial<ImageBlock>) => void;
}

export function ImageBlockEdit({ block, availableImages, onChange }: ImageBlockEditProps) {
  return (
    <div className="space-y-4">
      <ImageSelector
        label="Selecteer afbeelding"
        selectedImageId={block.imageId || null}
        availableImages={availableImages}
        onSelect={(imageId) => onChange({ imageId: imageId || undefined })}
      />

      <div className="space-y-2">
        <Label htmlFor={`block-${block.id}-caption`}>Bijschrift (optioneel)</Label>
        <Input
          id={`block-${block.id}-caption`}
          value={block.caption || ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Voer een bijschrift in..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`block-${block.id}-alt`}>Alt tekst (optioneel)</Label>
        <Input
          id={`block-${block.id}-alt`}
          value={block.alt || ''}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Beschrijving voor toegankelijkheid..."
        />
      </div>
    </div>
  );
}

interface ImageBlockComponentProps {
  block: ImageBlock;
  mode: 'edit' | 'display';
  availableImages?: ImageMetadata[];
  onChange?: (data: Partial<ImageBlock>) => void;
}

export function ImageBlockComponent({
  block,
  mode,
  availableImages = [],
  onChange,
}: ImageBlockComponentProps) {
  if (mode === 'display') {
    return <ImageBlockDisplay block={block} />;
  }
  return <ImageBlockEdit block={block} availableImages={availableImages} onChange={onChange!} />;
}
