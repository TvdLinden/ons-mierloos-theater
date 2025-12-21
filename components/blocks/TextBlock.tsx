'use client';

import { useRef } from 'react';
import WysiwygEditor, { WysiwygEditorRef } from '@/components/WysiwygEditor';
import type { TextBlock } from '@/lib/schemas/blocks';

interface TextBlockComponentProps {
  block: TextBlock;
  mode: 'edit' | 'display';
  onChange?: (content: string) => void;
}

export function TextBlockComponent({ block, mode, onChange }: TextBlockComponentProps) {
  const editorRef = useRef<WysiwygEditorRef>(null);

  const handleBlur = () => {
    if (editorRef.current && onChange) {
      const html = editorRef.current.getHTML();
      onChange(html);
    }
  };

  if (mode === 'display') {
    return (
      <div
        className="prose prose-lg max-w-none w-full max-w-[65ch]"
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Text content</label>
      <div onBlur={handleBlur}>
        <WysiwygEditor
          ref={editorRef}
          name={`block-${block.id}-content`}
          defaultValue={block.content}
        />
      </div>
    </div>
  );
}
