import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';
import type { NewsArticle, Image as ImageType } from '@ons-mierloos-theater/shared/db';

export type NewsArticleWithImage = NewsArticle & {
  image?: ImageType | null;
  blurDataUrl?: string | null;
};

function extractPlainText(content: string): string {
  return (content || '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[#>*_`~\-]{1,}/g, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function NewsCard({ article }: { article: NewsArticleWithImage }) {
  const plain = extractPlainText(article.content);
  const excerpt = plain.length > 120 ? `${plain.slice(0, 120)}…` : plain;

  const formattedDate = article.publishedAt
    ? new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
        .format(new Date(article.publishedAt))
        .toUpperCase()
    : null;

  return (
    <Link href={`/nieuws/${article.slug}`} className="group flex flex-col flex-1">
      {/* Image */}
      <div className="relative overflow-hidden bg-muted" style={{ paddingTop: '75%' }}>
        {article.imageId && (
          <Image
            src={`/api/images/${article.imageId}`}
            alt={article.title || 'Afbeelding'}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={getFocalPointStyle(article.image?.focalPoints, '4:3')}
            placeholder={article.blurDataUrl ? 'blur' : 'empty'}
            blurDataURL={article.blurDataUrl ?? undefined}
          />
        )}
      </div>

      {/* Content */}
      <div className="pt-4 pb-2 flex flex-col justify-between flex-1 gap-4">
        <div className="flex flex-col gap-2">
          {formattedDate && (
            <p
              className="text-xs font-bold tracking-widest uppercase text-muted-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {formattedDate}
            </p>
          )}
          <h3
            className="text-xl uppercase leading-tight line-clamp-2 text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {article.title}
          </h3>
          {excerpt && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{excerpt}</p>
          )}
        </div>
        <Button
          variant="maroon"
          size="sm"
          className="w-full"
          style={{ backgroundColor: 'var(--color-maroon)' }}
        >
          Lees meer
        </Button>
      </div>
    </Link>
  );
}
