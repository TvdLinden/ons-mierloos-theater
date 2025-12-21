'use server';

import { redirect } from 'next/navigation';
import { createPage } from '@/lib/commands/pages';
import { PageForm } from '../page-form';
import { getAllImages } from '@/lib/queries/images';
import { blocksArraySchema } from '@/lib/schemas/blocks';
import type { FormActionResult, InitialFormValues } from '../page-form';

export default async function AddPage() {
  const images = await getAllImages(0, 1000);

  async function handleSubmit(
    prevState: FormActionResult,
    formData: FormData,
  ): Promise<InitialFormValues> {
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

    await createPage({
      title,
      slug,
      blocks: blocks || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      content: '',
      status: 'draft',
    });
    redirect('/admin/pages');
    const result: InitialFormValues & { success: boolean } = {
      ...prevState,
      blocks,
      success: true,
    };
    return result;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-semibold mb-6">Nieuwe pagina toevoegen</h1>
      <PageForm initialValues={null} action={handleSubmit} availableImages={images} />
    </div>
  );
}
