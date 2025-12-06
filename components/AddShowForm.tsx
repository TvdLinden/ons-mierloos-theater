'use client';

import { useActionState, useState } from 'react';
import { Button, SimpleFormField as FormField, Input } from '@/components/ui';
import FormError from './FormError';
import ImageUpload from './ImageUpload';
import StatusSelector from './StatusSelector';
import TagSelector from './TagSelector';
import MarkdownEditor from './MarkdownEditor';
import { Tag } from '@/lib/db';

type ShowFormProps = {
  action: (prevState: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
  initialData?: {
    title?: string;
    subtitle?: string;
    slug?: string;
    description?: string;
    basePrice?: string;
    status?: 'draft' | 'published' | 'archived';
    tagIds?: string[];
  };
  availableTags: Tag[];
};

export default function AddShowForm({ action, initialData, availableTags }: ShowFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

  return (
    <form action={formAction} className="space-y-6">
      <FormField label="Titel" required>
        <Input
          name="title"
          defaultValue={initialData?.title}
          placeholder="Bijv. Hamlet"
          required
          disabled={isPending}
        />
      </FormField>

      <FormField label="Ondertitel">
        <Input
          name="subtitle"
          defaultValue={initialData?.subtitle}
          placeholder="Bijv. Een tragedie van Shakespeare"
          disabled={isPending}
        />
      </FormField>

      <FormField label="Slug" helperText="URL-vriendelijke naam (laat leeg voor automatisch)">
        <Input
          name="slug"
          defaultValue={initialData?.slug}
          placeholder="bijv. hamlet-2025"
          disabled={isPending}
        />
      </FormField>

      <FormField label="Beschrijving" required>
        <MarkdownEditor
          name="description"
          defaultValue={initialData?.description}
          placeholder="Vertel meer over de voorstelling..."
          disabled={isPending}
        />
      </FormField>

      <FormField label="Basisprijs" required helperText="Standaardprijs per ticket in euro's">
        <Input
          name="basePrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initialData?.basePrice}
          placeholder="25.00"
          required
          disabled={isPending}
        />
      </FormField>

      <FormField label="Afbeelding" helperText="JPEG of PNG, max 5MB">
        <ImageUpload
          name="image"
          label=""
          onChange={(file) => {
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => setPreviewUrl(e.target?.result as string);
              reader.readAsDataURL(file);
            } else {
              setPreviewUrl(undefined);
            }
          }}
          previewUrl={previewUrl}
        />
      </FormField>

      <FormField label="Tags" helperText="Categoriseer de voorstelling">
        <TagSelector
          availableTags={availableTags}
          selectedTagIds={initialData?.tagIds}
          name="tagIds"
        />
      </FormField>

      <FormField label="Status" required>
        <StatusSelector
          name="status"
          defaultValue={initialData?.status || 'draft'}
          options={[
            { value: 'draft', label: 'Concept' },
            { value: 'published', label: 'Gepubliceerd' },
            { value: 'archived', label: 'Gearchiveerd' },
          ]}
        />
      </FormField>

      {state.error && <FormError error={state.error} />}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Opslaan...' : initialData ? 'Bijwerken' : 'Opslaan'}
      </Button>
    </form>
  );
}
