'use server';

import { notFound, redirect } from 'next/navigation';
import { getPageById } from '@/lib/commands/pages';
import { updatePage } from '@/lib/commands/pages';
import { PageForm } from '../../page-form';
import { getAllImages } from '@/lib/queries/images';
import { blocksArraySchema } from '@/lib/schemas/blocks';
import type { Page } from '@/lib/db';
import type { BlocksArray } from '@/lib/schemas/blocks';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function EditPage({ params }) {
  const { id } = await params;
  const page = await getPageById(id);
  const images = await getAllImages(0, 1000);

  if (!page) notFound();

  async function handleSubmit(prevState: Partial<Page>, formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const blocksJson = formData.get('blocks') as string;

    let blocks = null;
    if (blocksJson) {
      try {
        const parsed = JSON.parse(blocksJson);
        blocks = blocksArraySchema.parse(parsed);
      } catch (error) {
        console.error('Error parsing blocks:', error);
        throw new Error('Invalid blocks format');
      }
    }

    await updatePage(id, {
      title,
      slug,
      blocks: blocks || undefined,
      updatedAt: new Date(),
    });
    redirect('/admin/pages');

    const result: Partial<Page> & { blocks?: BlocksArray; success: boolean } = {
      ...prevState,
      blocks,
      success: true,
    };
    return result;
  }

  return (
    <>
      <AdminPageHeader
        title="Bewerk pagina"
        breadcrumbs={[
          { label: "Pagina's", href: '/admin/pages' },
          { label: page.title },
        ]}
      />
      <PageForm initialValues={page} action={handleSubmit} availableImages={images} />
    </>
  );
}
