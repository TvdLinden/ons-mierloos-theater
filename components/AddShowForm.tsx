'use client';

import { useActionState } from 'react';
import { Button, FormField, Input, Textarea } from '@/components/ui';
import { FormError } from './FormError';
import { ImageUpload } from './ImageUpload';
import StatusSelector from './StatusSelector';
import TagSelector from './TagSelector';

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
};

export default function AddShowForm({ action, initialData }: ShowFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

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
        <Textarea
          name="description"
          defaultValue={initialData?.description}
          placeholder="Vertel meer over de voorstelling..."
          rows={6}
          required
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
        <ImageUpload name="image" disabled={isPending} />
      </FormField>

      <FormField label="Tags" helperText="Categoriseer de voorstelling">
        <TagSelector name="tagIds" defaultValue={initialData?.tagIds} disabled={isPending} />
      </FormField>

      <FormField label="Status" required>
        <StatusSelector
          name="status"
          defaultValue={initialData?.status || 'draft'}
          disabled={isPending}
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
