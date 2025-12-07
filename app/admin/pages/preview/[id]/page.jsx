import { notFound } from 'next/navigation';
import { getPageById } from '@/lib/queries/pages';

export default async function Page({ params }) {
  const { id } = await params;

  const page = await getPageById(id);

  if (!page) {
    notFound();
  }

  return (
    <article className="prose prose-lg text-center mx-auto">
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
    </article>
  );
}
