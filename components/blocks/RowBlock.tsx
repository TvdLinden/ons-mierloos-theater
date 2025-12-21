'use client';

import { BlockEditor } from '@/components/BlockEditor';
import { BlockRenderer } from '@/components/BlockRenderer';
import type { RowBlock } from '@/lib/schemas/blocks';
import type { ImageMetadata } from '@/lib/db';

interface RowBlockComponentProps {
  block: RowBlock;
  mode: 'edit' | 'display';
  availableImages?: ImageMetadata[];
  onChange?: (data: Partial<RowBlock>) => void;
}

export function RowBlockComponent({
  block,
  mode,
  availableImages = [],
  onChange,
}: RowBlockComponentProps) {
  if (mode === 'display') {
    return (
      <div className="flex gap-6 w-full max-w-[65ch]">
        {block.children.map((child) => (
          <div key={child.id} className="flex-1 min-w-0">
            <BlockRenderer blocks={[child]} images={availableImages} />
          </div>
        ))}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-3">
      <div className="bg-purple-50 border border-purple-200 rounded p-4">
        <p className="text-sm font-medium text-purple-900 mb-4">Row (Horizontal Stack)</p>
        <BlockEditor
          initialBlocks={block.children}
          availableImages={availableImages}
          name={`${block.id}-children`}
          onChange={(children) => onChange?.({ children })}
          allowedBlockTypes={['text', 'image', 'youtube', 'gallery', 'column']}
        />
      </div>
    </div>
  );
}
