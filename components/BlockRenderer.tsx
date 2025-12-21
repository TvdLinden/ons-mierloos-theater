'use client';

import { TextBlockComponent } from '@/components/blocks/TextBlock';
import { ImageBlockComponent } from '@/components/blocks/ImageBlock';
import { YoutubeBlockComponent } from '@/components/blocks/YoutubeBlock';
import { GalleryBlockComponent } from '@/components/blocks/GalleryBlock';
import { ColumnBlockComponent } from '@/components/blocks/ColumnBlock';
import { RowBlockComponent } from '@/components/blocks/RowBlock';
import type { Block, BlocksArray } from '@/lib/schemas/blocks';
import type { ImageMetadata } from '@/lib/db';

interface BlockRendererProps {
  blocks: BlocksArray;
  images: ImageMetadata[];
}

function RenderBlock({ block, images }: { block: Block; images: ImageMetadata[] }) {
  switch (block.type) {
    case 'text':
      return <TextBlockComponent block={block} mode="display" />;

    case 'image':
      return <ImageBlockComponent block={block} mode="display" availableImages={images} />;

    case 'youtube':
      return <YoutubeBlockComponent block={block} mode="display" />;

    case 'gallery':
      return <GalleryBlockComponent block={block} mode="display" availableImages={images} />;

    case 'column':
      return <ColumnBlockComponent block={block} mode="display" availableImages={images} />;

    case 'row':
      return <RowBlockComponent block={block} mode="display" availableImages={images} />;

    default:
      return null;
  }
}

export function BlockRenderer({ blocks, images }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <>
      {sortedBlocks.map((block) => (
        <RenderBlock key={block.id} block={block} images={images} />
      ))}
    </>
  );
}
