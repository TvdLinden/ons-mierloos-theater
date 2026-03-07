import type { Metadata, ResolvingMetadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getNewsArticleBySlug } from '@ons-mierloos-theater/shared/queries/content';
import { getImageUrl } from '@ons-mierloos-theater/shared/utils/image-url';
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';
import { ArrowLeft } from 'lucide-react';

const cachedGetNewsArticle = cache(getNewsArticleBySlug);

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const article = await cachedGetNewsArticle(slug);

  if (!article) {
    return {};
  }

  const title = article.title || 'Nieuwsartikel';
  const description =
    article.content?.substring(0, 160) || 'Lees dit artikel op Ons Mierloos Theater';
  const imageUrl = article.imageId ? getImageUrl(article.imageId) : undefined;
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://onsmierloos.nl'}/nieuws/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await cachedGetNewsArticle(slug);

  if (!article) {
    notFound();
  }

  // Parse markdown-like content (basic support for common patterns)
  const renderContent = (content: string) => {
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none prose-a:text-primary prose-a:underline hover:prose-a:no-underline">
        {content.split('\n\n').map((paragraph, idx) => {
          // Skip empty paragraphs
          if (!paragraph.trim()) return null;

          // Handle headings
          if (paragraph.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-3xl font-bold mt-8 mb-4 text-foreground">
                {paragraph.replace('# ', '')}
              </h1>
            );
          }
          if (paragraph.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-2xl font-bold mt-6 mb-3 text-foreground">
                {paragraph.replace('## ', '')}
              </h2>
            );
          }
          if (paragraph.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-xl font-bold mt-4 mb-2 text-foreground">
                {paragraph.replace('### ', '')}
              </h3>
            );
          }

          // Handle lists
          if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
            const items = paragraph.split('\n').filter((line) => line.trim());
            return (
              <ul key={idx} className="list-disc list-inside space-y-2 my-4 text-muted-foreground">
                {items.map((item, i) => (
                  <li key={i} className="ml-2">
                    {item.replace(/^[-*]\s+/, '')}
                  </li>
                ))}
              </ul>
            );
          }

          // Handle bold and italic
          const processedText = paragraph
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/__(.+?)__/g, '<strong>$1</strong>')
            .replace(/_(.+?)_/g, '<em>$1</em>');

          // Regular paragraph
          return (
            <p
              key={idx}
              className="text-base leading-relaxed text-muted-foreground my-4"
              dangerouslySetInnerHTML={{ __html: processedText }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <article className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header Navigation */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/nieuws"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug naar nieuws
          </Link>
        </div>
      </div>

      {/* Hero Section with Image */}
      {article.imageId && (
        <div className="relative w-full h-[500px] lg:h-[600px] overflow-hidden bg-muted">
          <Image
            src={getImageUrl(article.imageId)}
            alt={article.title || 'Artikel afbeelding'}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            style={getFocalPointStyle(article.image?.focalPoints, 'hero')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      )}

      {/* Article Header */}
      <div className="max-w-4xl mx-auto px-4 py-12 lg:py-16">
        <div className="space-y-6">
          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground">
            {article.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {article.publishedAt && (
              <time
                dateTime={article.publishedAt.toISOString()}
                className="text-muted-foreground font-medium"
              >
                {formatDate(article.publishedAt)}
              </time>
            )}
            <div className="hidden sm:block w-1 h-1 rounded-full bg-muted-foreground/30" />
            <span className="text-muted-foreground">Ons Mierloos Theater</span>
          </div>

          {/* Divider */}
          <div className="pt-4">
            <div className="w-12 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full" />
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 pb-20 lg:pb-24">
        <div className="space-y-8">
          {article.content && (
            <div className="text-base lg:text-lg leading-relaxed text-muted-foreground">
              {renderContent(article.content)}
            </div>
          )}

          {/* Footer Divider */}
          <div className="pt-8">
            <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent" />
          </div>

          {/* Back to News Link */}
          <div className="pt-4">
            <Link
              href="/nieuws"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Alle artikelen
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default NewsArticlePage;
