'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MarkdownEditor, { type MarkdownEditorRef } from '@/components/MarkdownEditor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { HomepageContent } from '@/lib/db';
import { updateHomepageContentAction } from './actions';

type HomepageContentFormProps = {
  initialData: HomepageContent | null;
};

export function HomepageContentForm({ initialData }: HomepageContentFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const introTextEditorRef = useRef<MarkdownEditorRef>(null);

  const [formData, setFormData] = useState({
    introTitle: initialData?.introTitle || '',
    introText: initialData?.introText || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const introText = introTextEditorRef.current?.getMarkdown() || '';

    const result = await updateHomepageContentAction({
      introTitle: formData.introTitle,
      introText: introText,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      startTransition(() => {
        router.refresh();
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>Homepage inhoud succesvol bijgewerkt!</AlertDescription>
        </Alert>
      )}

      <div>
        <label htmlFor="introTitle" className="block text-sm font-medium mb-2">
          Intro Titel
        </label>
        <Input
          id="introTitle"
          value={formData.introTitle}
          onChange={(e) => setFormData({ ...formData, introTitle: e.target.value })}
          placeholder="Welkom bij Ons Mierloos Theater"
        />
      </div>

      <div>
        <label htmlFor="introText" className="block text-sm font-medium mb-2">
          Intro Tekst
        </label>
        <MarkdownEditor
          name="introText"
          defaultValue={formData.introText}
          placeholder="Beschrijf hier de introductie voor de homepagina..."
          ref={introTextEditorRef}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Opslaan...' : 'Opslaan'}
      </Button>
    </form>
  );
}
