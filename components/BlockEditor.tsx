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
  ArrowUp,
  ArrowDown,
  Columns3,
  Rows3,
} from 'lucide-react';
import { TextBlockComponent } from '@/components/blocks/TextBlock';
import { ImageBlockComponent } from '@/components/blocks/ImageBlock';
import { YoutubeBlockComponent } from '@/components/blocks/YoutubeBlock';
import { GalleryBlockComponent } from '@/components/blocks/GalleryBlock';
import { ColumnBlockComponent } from '@/components/blocks/ColumnBlock';
import { RowBlockComponent } from '@/components/blocks/RowBlock';
import type { Block, BlocksArray } from '@/lib/schemas/blocks';
import type { ImageMetadata } from '@/lib/db';

interface BlockEditorProps {
  initialBlocks?: BlocksArray;
  availableImages?: ImageMetadata[];
  name?: string;
  onChange?: (blocks: BlocksArray) => void;
  allowedBlockTypes?: Block['type'][];
}

interface SortableBlockProps {
  block: Block;
  availableImages: ImageMetadata[];
  onUpdate: (id: string, data: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function SortableBlock({
  block,
  availableImages,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SortableBlockProps) {
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
      case 'column':
        return (
          <ColumnBlockComponent
            block={block}
            mode="edit"
            availableImages={availableImages}
            onChange={(data) => onUpdate(block.id, data)}
          />
        );
      case 'row':
        return (
          <RowBlockComponent
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
    column: 'Kolom',
    row: 'Rij',
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
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onMoveUp}
                  title="Move block up"
                  disabled={block.order === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onMoveDown}
                  title="Move block down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
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
  onChange,
  allowedBlockTypes,
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
      ...(type === 'column' && { children: [] }),
      ...(type === 'row' && { children: [] }),
    } as Block;

    setBlocks([...blocks, newBlock]);
    onChange?.([...blocks, newBlock]);
  };

  const updateBlock = (id: string, data: Partial<Omit<Block, 'id' | 'order' | 'type'>>) => {
    setBlocks((prev) => {
      const updated = prev.map((block) =>
        block.id === id ? ({ ...block, ...data } as Block) : block,
      );
      onChange?.(updated);
      return updated;
    });
  };

  const deleteBlock = (id: string) => {
    setBlocks((prev) => {
      const deleted = prev
        .filter((block) => block.id !== id)
        .map((block, index) => ({ ...block, order: index }));
      onChange?.(deleted);
      return deleted;
    });
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    setBlocks((items) => {
      const currentIndex = items.findIndex((item) => item.id === id);
      if (currentIndex === -1) return items;

      let newItems = items;
      if (direction === 'up' && currentIndex > 0) {
        newItems = [...items];
        [newItems[currentIndex], newItems[currentIndex - 1]] = [
          newItems[currentIndex - 1],
          newItems[currentIndex],
        ];
      } else if (direction === 'down' && currentIndex < items.length - 1) {
        newItems = [...items];
        [newItems[currentIndex], newItems[currentIndex + 1]] = [
          newItems[currentIndex + 1],
          newItems[currentIndex],
        ];
      } else {
        return items;
      }

      const reordered = newItems.map((block, index) => ({ ...block, order: index }));
      onChange?.(reordered);
      return reordered;
    });
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
                onMoveUp={() => moveBlock(block.id, 'up')}
                onMoveDown={() => moveBlock(block.id, 'down')}
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
          {(!allowedBlockTypes || allowedBlockTypes.includes('text')) && (
            <DropdownMenuItem onClick={() => addBlock('text')}>
              <Type className="mr-2 h-4 w-4" />
              Tekst
            </DropdownMenuItem>
          )}
          {(!allowedBlockTypes || allowedBlockTypes.includes('image')) && (
            <DropdownMenuItem onClick={() => addBlock('image')}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Afbeelding
            </DropdownMenuItem>
          )}
          {(!allowedBlockTypes || allowedBlockTypes.includes('youtube')) && (
            <DropdownMenuItem onClick={() => addBlock('youtube')}>
              <Youtube className="mr-2 h-4 w-4" />
              YouTube video
            </DropdownMenuItem>
          )}
          {(!allowedBlockTypes || allowedBlockTypes.includes('gallery')) && (
            <DropdownMenuItem onClick={() => addBlock('gallery')}>
              <Images className="mr-2 h-4 w-4" />
              Galerij
            </DropdownMenuItem>
          )}
          {(!allowedBlockTypes || allowedBlockTypes.includes('column')) && (
            <DropdownMenuItem onClick={() => addBlock('column')}>
              <Rows3 className="mr-2 h-4 w-4" />
              Kolom
            </DropdownMenuItem>
          )}
          {(!allowedBlockTypes || allowedBlockTypes.includes('row')) && (
            <DropdownMenuItem onClick={() => addBlock('row')}>
              <Columns3 className="mr-2 h-4 w-4" />
              Rij
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={serializedBlocks} />
    </div>
  );
}
