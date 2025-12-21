import { notFound } from 'next/navigation';
import { getPageById } from '@/lib/queries/pages';
import { getAllImageMetadata } from '@/lib/queries/images';
import Prose from '@/components/Prose';
import { BlockRenderer } from '@/components/BlockRenderer';

export default async function Page({ params }) {
  const { id } = await params;

  const [page, images] = await Promise.all([getPageById(id), getAllImageMetadata(0, 1000)]);

  if (!page) {
    notFound();
  }

  return (
    <main className="container items-center flex flex-col mx-auto px-4 py-8">
      {page.blocks && page.blocks.length > 0 ? (
        <BlockRenderer blocks={page.blocks} images={images} />
      ) : (
        <Prose content={page.content} />
      )}
    </main>
  );
}
