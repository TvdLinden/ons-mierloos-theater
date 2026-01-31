'use server';

import { getPageBySlug } from '@/lib/queries/pages';
import { getAllImages } from '@/lib/queries/images';
import { getSeoSettings } from '@/lib/queries/settings';
import { notFound } from 'next/navigation';
import Prose from '@/components/Prose';
import { BlockRenderer } from '@/components/BlockRenderer';

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

  const [page, seoSettings] = await Promise.all([getCachedPage(slug), getSeoSettings()]);

  if (!page) {
    notFound();
  }

  const title = `${page.title} — ${seoSettings.defaultTitle || 'Ons Mierloos Theater'}`;
  const description = page.excerpt || page.description || seoSettings.defaultDescription || '';

  return {
    title,
    description: description.slice(0, 160),
    keywords: seoSettings.defaultKeywords,
    openGraph: {
      title,
      description,
      type: seoSettings.ogType || 'website',
      images: seoSettings.ogImage ? [seoSettings.ogImage] : [],
    },
    twitter: {
      card: seoSettings.twitterCard || 'summary_large_image',
      site: seoSettings.twitterSite,
      title,
      description,
      images: seoSettings.ogImage ? [seoSettings.ogImage] : [],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;

  const [page, images] = await Promise.all([getCachedPage(slug), getAllImages(0, 1000)]);

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
