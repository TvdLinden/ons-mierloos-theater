'use client';

import { useActionState } from 'react';
import { SimpleFormField, Button, Input } from '@/components/ui';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Page } from '@/lib/db';

type InitialFormValues = Partial<Page>;
export type FormActionResult = InitialFormValues & { success: boolean };

type FormAction = (prevState: FormActionResult, formData: FormData) => Promise<InitialFormValues>;

type PageFormProps = {
  initialValues?: InitialFormValues;
  action: FormAction;
};
export function PageForm({ initialValues, action }: PageFormProps) {
  const [, formAction] = useActionState(action, initialValues);

  return (
    <form action={formAction} className="space-y-4">
      <SimpleFormField label="Titel" htmlFor="title">
        <Input id="title" name="title" defaultValue={initialValues?.title} required />
      </SimpleFormField>
      <SimpleFormField label="Slug" htmlFor="slug">
        <Input id="slug" name="slug" defaultValue={initialValues?.slug} required />
      </SimpleFormField>
      <SimpleFormField label="Inhoud" htmlFor="content">
        <MarkdownEditor name="content" defaultValue={initialValues?.content || ''} />
      </SimpleFormField>
      <div className="pt-4">
        <Button type="submit">Opslaan</Button>
      </div>
    </form>
  );
}
