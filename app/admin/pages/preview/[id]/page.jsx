import { notFound } from 'next/navigation';
import { getPageById } from '@/lib/queries/pages';

export default async function Page({ params }) {
  const { id } = await params;

  const page = await getPageById(id);

  if (!page) {
    notFound();
  }

  return (
    <main className="container items-center flex flex-col mx-auto px-4 py-8">
      <article className="prose prose-lg">
        <div dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>
    </main>
  );
}
