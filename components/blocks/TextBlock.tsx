'use client';

import { useRef } from 'react';
import WysiwygEditor, { WysiwygEditorRef } from '@/components/WysiwygEditor';
import type { TextBlock } from '@/lib/schemas/blocks';

interface TextBlockComponentProps {
  block: TextBlock;
  mode: 'edit' | 'display';
  onChange?: (content: string) => void;
}

export function TextBlockDisplayMode({ block }) {
  return (
    <div
      className="prose prose-lg w-full max-w-[65ch]"
      dangerouslySetInnerHTML={{ __html: block.content }}
    />
  );
}

export function TextBlockEditMode({ block, onChange }) {
  const editorRef = useRef<WysiwygEditorRef>(null);

  const handleBlur = () => {
    if (editorRef.current && onChange) {
      const html = editorRef.current.getHTML();
      onChange(html);
    }
  };

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

export function TextBlockComponent({ block, mode, onChange }: TextBlockComponentProps) {
  if (mode === 'display') {
    return <TextBlockDisplayMode block={block} />;
  }
  return <TextBlockEditMode block={block} onChange={onChange} />;
}
