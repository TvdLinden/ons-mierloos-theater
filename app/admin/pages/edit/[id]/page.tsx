'use server';

import { notFound, redirect } from 'next/navigation';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Button, Input, SimpleFormField } from '@/components/ui';
import { getPageById } from '@/lib/commands/pages';
import { updatePage } from '@/lib/commands/pages';
import { PageForm } from '../../page-form';
import { Page } from '@/lib/db';

export default async function EditPage({ params }) {
  const { id } = await params;
  const page = await getPageById(id);
  if (!page) notFound();

  async function handleSubmit(prevState: Partial<Page>, formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    await updatePage(id, { title, slug, content, updatedAt: new Date() });
    redirect('/admin/pages');

    return { ...prevState, success: true };
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-semibold mb-6">Bewerk pagina</h1>
      <PageForm initialValues={page} action={handleSubmit} />
    </div>
  );
}
