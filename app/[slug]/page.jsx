'use server';

import { getPageBySlug } from '@/lib/queries/pages';
import { notFound } from 'next/navigation';

// Simple in-process cache to avoid fetching the same page twice
// generateMetadata runs before the page component in the same server process,
// so we can store the result here and reuse it in the page render.
const pageCache = new Map();

async function getCachedPage(slug) {
  if (pageCache.has(slug)) return pageCache.get(slug);
  const page = await getPageBySlug(slug);
  if (page) pageCache.set(slug, page);
  return page;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  const page = await getCachedPage(slug);

  if (!page) {
    // Let Next.js render the not-found page
    notFound();
  }

  return {
    title: `${page.title} — Ons Mierloos Theater`,
    description: page.excerpt || (page.description || '').slice(0, 160) || 'Ons Mierloos Theater',
  };
}

export default async function Page({ params }) {
  const { slug } = await params;

  const page = await getCachedPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="container items-center flex flex-col mx-auto px-4 py-8">
      <article className="prose prose-lg text-center">
        <div dangerouslySetInnerHTML={{ __html: page.content }} />
      </article>
    </main>
  );
}
