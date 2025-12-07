'use server';

import { redirect } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Button, Input, SimpleFormField } from '@/components/ui';
import { createPage } from '@/lib/commands/pages';
import ShowForm from '@/components/ShowForm';
import type { Page } from '@/lib/db';
import { PageForm } from '../page-form';

export default async function AddPage() {
  async function handleSubmit(
    prevState: Partial<Page>,
    formData: FormData,
  ): Promise<Partial<Page>> {
    'use server';
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    await createPage({
      title,
      slug,
      content,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    redirect('/admin/pages');
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-semibold mb-6">Nieuwe pagina</h1>
      <PageForm action={handleSubmit} />
    </div>
  );
}
