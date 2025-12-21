'use client';

import { useRef } from 'react';
import MarkdownEditor, { MarkdownEditorRef } from '@/components/MarkdownEditor';
import type { TextBlock } from '@/lib/schemas/blocks';

interface TextBlockComponentProps {
  block: TextBlock;
  mode: 'edit' | 'display';
  onChange?: (content: string) => void;
}

export function TextBlockComponent({ block, mode, onChange }: TextBlockComponentProps) {
  const editorRef = useRef<MarkdownEditorRef>(null);

  const handleBlur = () => {
    if (editorRef.current && onChange) {
      const html = editorRef.current.getHTML();
      onChange(html);
    }
  };

  if (mode === 'display') {
    return (
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Text content</label>
      <div onBlur={handleBlur}>
        <MarkdownEditor
          ref={editorRef}
          name={`block-${block.id}-content`}
          defaultValue={block.content}
        />
      </div>
    </div>
  );
}
