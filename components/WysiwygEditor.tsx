'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Markdown } from '@tiptap/markdown';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image as ImageIcon,
  Play,
} from 'lucide-react';
import { useState, useImperativeHandle, useEffect } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Toggle } from './ui/toggle';
import { ToggleGroup } from './ui/toggle-group';

type WysiwygEditorProps = {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  ref?: React.Ref<WysiwygEditorRef>;
};

export type WysiwygEditorRef = {
  getHTML: () => string;
  getText: () => string;
  getMarkdown: () => string;
};

export default function WysiwygEditor({
  name,
  defaultValue,
  placeholder,
  disabled,
  ref,
}: WysiwygEditorProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [imageOpen, setImageOpen] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [, setEditorUpdate] = useState(0); // Force re-render on editor update

  const editor = useEditor({
    extensions: [
      PasteMarkdown.configure(),

      Markdown.configure({
        indentation: { size: 2, style: 'space' },
      }),
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'leading-7',
          },
        },
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
          HTMLAttributes: {
            class: 'font-bold leading-tight',
          },
        },
        bold: {
          HTMLAttributes: {
            class: 'font-bold',
          },
        },
        italic: {
          HTMLAttributes: {
            class: 'italic',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'leading-7',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-gray-100 dark:bg-gray-900 p-4 rounded-lg font-mono text-sm',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded font-mono text-sm',
          },
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg my-4',
        },
      }),
    ],
    content: defaultValue || '',
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none border border-border rounded-md p-4 min-h-64 outline-none bg-white dark:bg-slate-950 transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`,
      },
    },
    immediatelyRender: false,
    onUpdate: () => {
      // Force re-render when editor content changes
      setEditorUpdate((prev) => prev + 1);
    },
  });

  // Update content when defaultValue changes
  useEffect(() => {
    if (editor && defaultValue && editor.getHTML() === '<p></p>') {
      // Only update if editor is empty to avoid overwriting user edits
      editor.commands.setContent(defaultValue);
    }
  }, [editor, defaultValue]);

  useImperativeHandle(ref, () => ({
    getHTML: () => editor.getHTML(),
    getText: () => editor.getText(),
    getMarkdown: () => editor.getMarkdown(),
  }));

  if (!editor) {
    return null;
  }

  // Expose ref methods to get editor content
  const handleButtonClick = (command: () => boolean) => {
    command();
    editor.view.focus();
    // Force re-render immediately after command execution
    setEditorUpdate((prev) => prev + 1);
  };

  const handleAddImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setImageOpen(false);
    }
  };

  const handleAddYoutube = () => {
    if (youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
      setYoutubeOpen(false);
    }
  };

  // Recalculate toggleItems on every render to ensure isActive is always current
  const toggleItems = [
    {
      value: 'bold',
      icon: Bold,
      area: 'vet',
      title: 'Vet (Ctrl+B)',
      isActive: editor.isActive('bold'),
      onClick: () => handleButtonClick(() => editor.chain().focus().toggleBold().run()),
    },
    {
      value: 'italic',
      icon: Italic,
      title: 'Cursief (Ctrl+I)',
      area: 'italic',
      isActive: editor.isActive('italic'),
      onClick: () => handleButtonClick(() => editor.chain().focus().toggleItalic().run()),
    },
    {
      value: 'h1',
      icon: Heading1,
      title: 'Kop 1',
      area: 'h1',
      isActive: editor.isActive('heading', { level: 1 }),
      onClick: () =>
        handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 1 }).run()),
    },
    {
      value: 'h2',
      icon: Heading2,
      title: 'Kop 2',
      area: 'h2',
      isActive: editor.isActive('heading', { level: 2 }),
      onClick: () =>
        handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 2 }).run()),
    },
    {
      value: 'h3',
      icon: Heading3,
      title: 'Kop 3',
      area: 'h3',
      isActive: editor.isActive('heading', { level: 3 }),
      onClick: () =>
        handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 3 }).run()),
    },
    {
      value: 'h4',
      icon: Heading4,
      title: 'Kop 4',
      area: 'h4',
      isActive: editor.isActive('heading', { level: 4 }),
      onClick: () =>
        handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 4 }).run()),
    },
    {
      value: 'h5',
      icon: Heading5,
      title: 'Kop 5',
      area: 'h5',
      isActive: editor.isActive('heading', { level: 5 }),
      onClick: () =>
        handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 5 }).run()),
    },
    {
      value: 'h6',
      icon: Heading6,
      title: 'Kop 6',
      area: 'h6',
      isActive: editor.isActive('heading', { level: 6 }),
      onClick: () =>
        handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 6 }).run()),
    },
    {
      value: 'ul',
      icon: List,
      title: 'Opsomming',
      area: 'ul',
      isActive: editor.isActive('bulletList'),
      onClick: () => handleButtonClick(() => editor.chain().focus().toggleBulletList().run()),
    },
    {
      value: 'ol',
      icon: ListOrdered,
      title: 'Genummerde lijst',
      area: 'ol',
      isActive: editor.isActive('orderedList'),
      onClick: () => handleButtonClick(() => editor.chain().focus().toggleOrderedList().run()),
    },
  ];

  return (
    <div className="space-y-2 w-full">
      <ToggleGroup type="single" className="flex-wrap">
        {toggleItems.map((item) => (
          <Toggle
            key={item.value}
            aria-label={item.area}
            onClick={item.onClick}
            title={item.title}
            pressed={item.isActive}
          >
            <item.icon className="size-4" />
          </Toggle>
        ))}

        <div className="border-l border-gray-300 dark:border-slate-700" />

        <Popover open={imageOpen} onOpenChange={setImageOpen}>
          <PopoverTrigger asChild>
            <Toggle aria-label="Afbeelding toevoegen" title="Afbeelding toevoegen">
              <ImageIcon className="size-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Afbeelding toevoegen</h4>
              <Input
                type="url"
                placeholder="Plak afbeeldings-URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddImage();
                  }
                }}
              />
              <Button size="sm" onClick={handleAddImage} className="w-full">
                Afbeelding toevoegen
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={youtubeOpen} onOpenChange={setYoutubeOpen}>
          <PopoverTrigger asChild>
            <Toggle aria-label="YouTube-video toevoegen" title="YouTube-video toevoegen">
              <Play className="size-4" />
            </Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">YouTube-video toevoegen</h4>
              <Input
                type="url"
                placeholder="Plak YouTube-URL..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddYoutube();
                  }
                }}
              />
              <Button size="sm" onClick={handleAddYoutube} className="w-full">
                Video toevoegen
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </ToggleGroup>

      <EditorContent className="prose prose-lg max-w-none! w-full" editor={editor} />

      {/* Hidden input to store the HTML content */}
      <input type="hidden" name={name} value={editor?.getHTML() || ''} />
    </div>
  );
}

import { Editor, Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

const PasteMarkdown = Extension.create({
  name: 'pasteMarkdown',

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        props: {
          handlePaste(view, event, slice) {
            const text = event.clipboardData?.getData('text/plain');

            if (!text) {
              return false;
            }

            // Check if text looks like Markdown
            if (looksLikeMarkdown(text)) {
              console.log('Pasting Markdown content');

              if (editor?.markdown) {
                // Parse the Markdown text to Tiptap JSON using the Markdown manager
                const json = editor.markdown.parse(text);

                // Insert the parsed JSON content at cursor position
                editor.commands.insertContent(json);
                return true;
              }
            } else {
              console.log('not md');
            }

            return false;
          },
        },
      }),
    ];
  },
});

function looksLikeMarkdown(text: string): boolean {
  // Simple heuristic: check for Markdown syntax
  return (
    /^#{1,6}\s/.test(text) || // Headings
    /\*\*[^*]+\*\*/.test(text) || // Bold
    /\[.+\]\(.+\)/.test(text) || // Links
    /^[-*+]\s/.test(text)
  ); // Lists
}
