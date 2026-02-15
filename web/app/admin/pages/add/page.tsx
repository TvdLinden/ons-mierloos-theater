'use server';

import { redirect } from 'next/navigation';
import { createPage } from '@ons-mierloos-theater/shared/commands/pages';
import { syncImageUsages } from '@ons-mierloos-theater/shared/commands/imageUsages';
import { uploadImagesFromBlocks } from '@/lib/utils/uploadImagesFromBlocks';
import { PageForm } from '../page-form';
import { getAllImages } from '@ons-mierloos-theater/shared/queries/images';
import { blocksArraySchema } from '@ons-mierloos-theater/shared/schemas/blocks';
import type { BlocksArray } from '@ons-mierloos-theater/shared/schemas/blocks';
import type { FormActionResult, InitialFormValues } from '../page-form';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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

    let blocks: BlocksArray | null = null;
    if (blocksJson) {
      try {
        const parsed = JSON.parse(blocksJson);
        blocks = blocksArraySchema.parse(parsed);
      } catch (error) {
        console.error('Error parsing blocks:', error);
        throw new Error('Invalid blocks format');
      }
    }

    // Upload any base64 images and get cleaned blocks
    const cleanedBlocks = await uploadImagesFromBlocks(blocks);

    const newPageId = await createPage({
      title,
      slug,
      blocks: cleanedBlocks || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      content: '',
      status: 'draft',
    });

    // Sync image usages from blocks content
    await syncImageUsages('page', newPageId, cleanedBlocks);

    redirect('/admin/pages');
    const result: InitialFormValues & { success: boolean } = {
      ...prevState,
      blocks,
      success: true,
    };
    return result;
  }

  return (
    <>
      <AdminPageHeader
        title="Nieuwe pagina toevoegen"
        breadcrumbs={[{ label: "Pagina's", href: '/admin/pages' }, { label: 'Toevoegen' }]}
      />
      <PageForm initialValues={null} action={handleSubmit} availableImages={images} />
    </>
  );
}
