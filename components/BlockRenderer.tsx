'use client';

import { TextBlockDisplayMode } from '@/components/blocks/TextBlock';
import { ImageBlockDisplay } from '@/components/blocks/ImageBlock';
import { YoutubeBlockDisplay } from '@/components/blocks/YoutubeBlock';
import { GalleryBlockDisplay } from '@/components/blocks/GalleryBlock';
import { ColumnBlockDisplay } from '@/components/blocks/ColumnBlock';
import { RowBlockDisplay } from '@/components/blocks/RowBlock';
import type { Block, BlocksArray } from '@/lib/schemas/blocks';

interface BlockRendererProps {
  blocks: BlocksArray;
}

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'text':
      return <TextBlockDisplayMode block={block} />;

    case 'image':
      return <ImageBlockDisplay block={block} />;

    case 'youtube':
      return <YoutubeBlockDisplay block={block} />;

    case 'gallery':
      return <GalleryBlockDisplay block={block} />;

    case 'column':
      return <ColumnBlockDisplay block={block} />;

    case 'row':
      return <RowBlockDisplay block={block} />;

    default:
      return null;
  }
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <>
      {sortedBlocks.map((block) => (
        <RenderBlock key={block.id} block={block} />
      ))}
    </>
  );
}
