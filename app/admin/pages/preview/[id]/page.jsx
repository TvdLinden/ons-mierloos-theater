import { notFound } from 'next/navigation';
import { getPageById } from '@/lib/queries/pages';
import Prose from '@/components/Prose';

export default async function Page({ params }) {
  const { id } = await params;

  const page = await getPageById(id);

  if (!page) {
    notFound();
  }

  return (
    <main className="container items-center flex flex-col mx-auto px-4 py-8">
      <Prose content={page.content} />
    </main>
  );
}
