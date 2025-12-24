'use client';

import { BlockEditor } from '@/components/BlockEditor';
import { BlockRenderer } from '@/components/BlockRenderer';
import type { ColumnBlock } from '@/lib/schemas/blocks';
import type { ImageMetadata } from '@/lib/db';

export function ColumnBlockDisplay({ block }: { block: ColumnBlock }) {
  return (
    <div className="flex flex-col gap-6">
      <BlockRenderer blocks={block.children} />
    </div>
  );
}

// Edit-only component
interface ColumnBlockEditProps {
  block: ColumnBlock;
  availableImages: ImageMetadata[];
  onChange: (data: Partial<ColumnBlock>) => void;
}

export function ColumnBlockEdit({ block, availableImages, onChange }: ColumnBlockEditProps) {
  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-sm font-medium text-blue-900 mb-4">Column (Vertical Stack)</p>
        <div className="space-y-3">
          <BlockEditor
            initialBlocks={block.children}
            availableImages={availableImages}
            name={`${block.id}-children`}
            onChange={(children) => onChange({ children })}
            allowedBlockTypes={['text', 'image', 'youtube', 'gallery', 'row']}
          />
        </div>
      </div>
    </div>
  );
}
interface ColumnBlockComponentProps {
  block: ColumnBlock;
  mode: 'edit' | 'display';
  availableImages?: ImageMetadata[];
  onChange?: (data: Partial<ColumnBlock>) => void;
}

export function ColumnBlockComponent({
  block,
  mode,
  availableImages = [],
  onChange,
}: ColumnBlockComponentProps) {
  if (mode === 'display') {
    return <ColumnBlockDisplay block={block} />;
  }
  return <ColumnBlockEdit block={block} availableImages={availableImages} onChange={onChange!} />;
}
