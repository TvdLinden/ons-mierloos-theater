import { notFound } from 'next/navigation';
import { getPageById } from '@ons-mierloos-theater/shared/queries/pages';
import { getAllImages } from '@ons-mierloos-theater/shared/queries/images';
import Prose from '@/components/Prose';
import { BlockRenderer } from '@/components/BlockRenderer';

export default async function Page({ params }) {
  const { id } = await params;

  const [page, images] = await Promise.all([getPageById(id), getAllImages(0, 1000)]);

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
