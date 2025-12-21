'use client';

import { TextBlockComponent } from '@/components/blocks/TextBlock';
import { ImageBlockComponent } from '@/components/blocks/ImageBlock';
import { YoutubeBlockComponent } from '@/components/blocks/YoutubeBlock';
import { GalleryBlockComponent } from '@/components/blocks/GalleryBlock';
import type { Block, BlocksArray } from '@/lib/schemas/blocks';
import type { Image as ImageType } from '@/lib/db';

interface BlockRendererProps {
  blocks: BlocksArray;
  images: ImageType[];
}

function RenderBlock({ block, images }: { block: Block; images: ImageType[] }) {
  switch (block.type) {
    case 'text':
      return <TextBlockComponent block={block} mode="display" />;

    case 'image':
      return <ImageBlockComponent block={block} mode="display" availableImages={images} />;

    case 'youtube':
      return <YoutubeBlockComponent block={block} mode="display" />;

    case 'gallery':
      return <GalleryBlockComponent block={block} mode="display" availableImages={images} />;

    default:
      return null;
  }
}

export function BlockRenderer({ blocks, images }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div>
      {sortedBlocks.map((block) => (
        <RenderBlock key={block.id} block={block} images={images} />
      ))}
    </div>
  );
}
