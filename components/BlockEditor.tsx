'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical,
  Plus,
  Trash2,
  Type,
  Image as ImageIcon,
  Youtube,
  Images,
} from 'lucide-react';
import { TextBlockComponent } from '@/components/blocks/TextBlock';
import { ImageBlockComponent } from '@/components/blocks/ImageBlock';
import { YoutubeBlockComponent } from '@/components/blocks/YoutubeBlock';
import { GalleryBlockComponent } from '@/components/blocks/GalleryBlock';
import type { Block, BlocksArray } from '@/lib/schemas/blocks';
import type { Image as ImageType } from '@/lib/db';
import { blocksArraySchema } from '@/lib/schemas/blocks';

interface BlockEditorProps {
  initialBlocks?: BlocksArray;
  availableImages?: ImageType[];
  name?: string;
}

interface SortableBlockProps {
  block: Block;
  availableImages: ImageType[];
  onUpdate: (id: string, data: Partial<Block>) => void;
  onDelete: (id: string) => void;
}

function SortableBlock({ block, availableImages, onUpdate, onDelete }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderBlock = () => {
    switch (block.type) {
      case 'text':
        return (
          <TextBlockComponent
            block={block}
            mode="edit"
            onChange={(content) => onUpdate(block.id, { content })}
          />
        );
      case 'image':
        return (
          <ImageBlockComponent
            block={block}
            mode="edit"
            availableImages={availableImages}
            onChange={(data) => onUpdate(block.id, data)}
          />
        );
      case 'youtube':
        return (
          <YoutubeBlockComponent
            block={block}
            mode="edit"
            onChange={(data) => onUpdate(block.id, data)}
          />
        );
      case 'gallery':
        return (
          <GalleryBlockComponent
            block={block}
            mode="edit"
            availableImages={availableImages}
            onChange={(data) => onUpdate(block.id, data)}
          />
        );
      default:
        return null;
    }
  };

  const blockTypeLabels = {
    text: 'Tekst',
    image: 'Afbeelding',
    youtube: 'YouTube',
    gallery: 'Galerij',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {blockTypeLabels[block.type]}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(block.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {renderBlock()}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function BlockEditor({
  initialBlocks = [],
  availableImages = [],
  name = 'blocks',
}: BlockEditorProps) {
  const [blocks, setBlocks] = useState<BlocksArray>(initialBlocks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const reordered = arrayMove(items, oldIndex, newIndex);
        // Update order property
        return reordered.map((block, index) => ({ ...block, order: index }));
      });
    }
  };

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      order: blocks.length,
      ...(type === 'text' && { content: '' }),
      ...(type === 'image' && { imageId: '', caption: '', alt: '' }),
      ...(type === 'youtube' && { url: '', title: '' }),
      ...(type === 'gallery' && { imageIds: [], caption: '', visibleImages: 1 }),
    } as Block;

    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, data: Partial<Omit<Block, 'id' | 'order' | 'type'>>) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? ({ ...block, ...data } as Block) : block)),
    );
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) =>
      prev.filter((block) => block.id !== id).map((block, index) => ({ ...block, order: index })),
    );
  };

  // Validate and serialize blocks for form submission
  const serializedBlocks = JSON.stringify(blocks);

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                availableImages={availableImages}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">Geen blokken toegevoegd</p>
          <p className="text-sm text-muted-foreground">
            Klik op &quot;Blok toevoegen&quot; om te beginnen
          </p>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Blok toevoegen
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => addBlock('text')}>
            <Type className="mr-2 h-4 w-4" />
            Tekst
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock('image')}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Afbeelding
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock('youtube')}>
            <Youtube className="mr-2 h-4 w-4" />
            YouTube video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addBlock('gallery')}>
            <Images className="mr-2 h-4 w-4" />
            Galerij
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={serializedBlocks} />
    </div>
  );
}
