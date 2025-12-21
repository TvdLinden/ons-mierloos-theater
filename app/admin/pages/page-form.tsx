'use client';

import { useActionState } from 'react';
import { SimpleFormField, Button, Input } from '@/components/ui';
import { BlockEditor } from '@/components/BlockEditor';
import { Page, Image } from '@/lib/db';
import type { BlocksArray } from '@/lib/schemas/blocks';

export type InitialFormValues = Partial<Page> & { blocks?: BlocksArray };
export type FormActionResult = InitialFormValues & { success: boolean };

type FormAction = (prevState: FormActionResult, formData: FormData) => Promise<InitialFormValues>;

type PageFormProps = {
  initialValues?: InitialFormValues;
  action: FormAction;
  availableImages?: Image[];
};
export function PageForm({ initialValues, action, availableImages = [] }: PageFormProps) {
  const [, formAction] = useActionState(action, initialValues);

  return (
    <form action={formAction} className="space-y-4">
      <SimpleFormField label="Titel" htmlFor="title">
        <Input id="title" name="title" defaultValue={initialValues?.title} required />
      </SimpleFormField>
      <SimpleFormField label="Slug" htmlFor="slug">
        <Input id="slug" name="slug" defaultValue={initialValues?.slug} required />
      </SimpleFormField>
      <SimpleFormField label="Inhoud" htmlFor="blocks">
        <BlockEditor
          initialBlocks={initialValues?.blocks || []}
          availableImages={availableImages}
          name="blocks"
        />
      </SimpleFormField>
      <div className="pt-4">
        <Button type="submit">Opslaan</Button>
      </div>
    </form>
  );
}
