'use client';

import { useRef, useState } from 'react';
import WysiwygEditor, { WysiwygEditorRef } from '@/components/WysiwygEditor';
import type { TextBlock } from '@ons-mierloos-theater/shared/schemas/blocks';
import { cn } from '@/lib/utils';
import {
  Label,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  Input,
  SelectValue,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui';
import { ChevronDown } from 'lucide-react';

interface TextBlockComponentProps {
  block: TextBlock;
  mode: 'edit' | 'display';
  onChange?: (content: Partial<TextBlock>) => void;
}

export function TextBlockDisplayMode({ block }: { block: TextBlock }) {
  return (
    <div
      className={cn(
        'w-full max-w-[65ch]',
        block.proseVariant || 'prose',
        block.textAlignment || 'text-left',
        block.className,
      )}
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  );
}

export function TextBlockEditMode({
  block,
  onChange,
}: {
  block: TextBlock;
  onChange?: (content: Partial<TextBlock>) => void;
}) {
  const editorRef = useRef<WysiwygEditorRef>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleBlur = () => {
    if (editorRef.current && onChange) {
      const html = editorRef.current.getHTML();
      onChange({ content: html });
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor={`block-${block.id}-content`}>Tekstinhoud</Label>
        <div onBlur={handleBlur}>
          <WysiwygEditor
            ref={editorRef}
            name={`block-${block.id}-content`}
            defaultValue={block.content}
          />
        </div>
      </div>

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
            <Label htmlFor={`block-${block.id}-alignment`}>Tekstuitlijning</Label>
            <Select
              value={block.textAlignment || 'text-left'}
              onValueChange={(value) =>
                onChange && onChange({ textAlignment: value as TextBlock['textAlignment'] })
              }
            >
              <SelectTrigger id={`block-${block.id}-alignment`}>
                <SelectValue placeholder="Kies uitlijning" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text-left">Links</SelectItem>
                <SelectItem value="text-center">Midden</SelectItem>
                <SelectItem value="text-right">Rechts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`block-${block.id}-prose-variant`}>Tekstgrootte</Label>
            <Select
              value={block.proseVariant || 'prose'}
              onValueChange={(value) =>
                onChange && onChange({ proseVariant: value as TextBlock['proseVariant'] })
              }
            >
              <SelectTrigger id={`block-${block.id}-prose-variant`}>
                <SelectValue placeholder="Kies formaat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prose">Standaard</SelectItem>
                <SelectItem value="prose-lg">Groot</SelectItem>
                <SelectItem value="prose-sm">Klein</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor={`block-${block.id}-class-name`}>Aangepaste klassen</Label>
            <Input
              id={`block-${block.id}-class-name`}
              value={block.className || ''}
              onChange={(e) => onChange && onChange({ className: e.target.value })}
              placeholder="Bijv. mt-4 mb-2"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function TextBlockComponent({ block, mode, onChange }: TextBlockComponentProps) {
  if (mode === 'display') {
    return <TextBlockDisplayMode block={block} />;
  }
  return <TextBlockEditMode block={block} onChange={onChange} />;
}
