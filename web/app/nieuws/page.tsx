import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getActiveNewsArticles } from '@ons-mierloos-theater/shared/queries/content';
import { getImageUrl } from '@ons-mierloos-theater/shared/utils/image-url';
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';
import NewsletterSignup from '@/components/NewsletterSignup';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nieuws | Ons Mierloos Theater',
  description:
    'Lees het laatste nieuws van Ons Mierloos Theater. Artikelen over voorstellingen, evenementen en theaternieuws.',
  openGraph: {
    title: 'Nieuws | Ons Mierloos Theater',
    description:
      'Lees het laatste nieuws van Ons Mierloos Theater. Artikelen over voorstellingen, evenementen en theaternieuws.',
    url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://onsmierloos.nl'}/nieuws`,
    type: 'website',
  },
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function extractPreview(content: string, maxLength: number = 150): string {
  // Remove markdown formatting
  const text = (content || '')
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links but keep text
    .replace(/[#>*_`~\-]{1,}/g, '') // Remove markdown symbols
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return text.length > maxLength ? `${text.substring(0, maxLength)}…` : text;
}

export default async function NewsPage() {
  const articles = await getActiveNewsArticles(50);

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="w-screen relative left-[calc(-50vw+50%)] bg-gradient-to-b from-primary/5 via-primary/2 to-background py-16 lg:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
                Nieuws
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Volg het laatste nieuws van Ons Mierloos Theater. Lees over nieuwe voorstellingen,
                achter de schermen verhalen en theatergebeurtenissen.
              </p>
            </div>
            {/* Accent Bar */}
            <div className="w-20 h-1.5 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/nieuws/${article.slug}`}
                className="group flex flex-col h-full rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Image Container */}
                {article.imageId && (
                  <div className="relative w-full h-56 bg-muted overflow-hidden">
                    <Image
                      src={getImageUrl(article.imageId)}
                      alt={article.title || 'Artikel afbeelding'}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      style={getFocalPointStyle(article.image?.focalPoints, 'card')}
                    />
                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                )}

                {/* Content */}
                <div className="flex flex-col flex-1 p-6 bg-card">
                  {/* Category/Date */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                      Artikel
                    </span>
                    {article.publishedAt && (
                      <time
                        dateTime={article.publishedAt.toISOString()}
                        className="text-xs text-muted-foreground"
                      >
                        {formatDate(article.publishedAt)}
                      </time>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
                    {article.title}
                  </h3>

                  {/* Preview */}
                  <p className="text-sm text-muted-foreground flex-1 mb-4 line-clamp-3">
                    {extractPreview(article.content)}
                  </p>

                  {/* Read More Link */}
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all duration-300">
                    Lees meer
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">Nog geen nieuwsartikelen gepubliceerd</p>
              <p className="text-sm text-muted-foreground">
                Kom later terug voor het laatste nieuws van Ons Mierloos Theater
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Newsletter Section */}
      <div className="w-screen relative left-[calc(-50vw+50%)] bg-gradient-to-b from-background via-primary/3 to-background py-20">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Abonneer je op ons nieuwsbrief</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ontvang het laatste nieuws, voorstellingsaankondigingen en exclusieve aanbiedingen
            direct in je inbox.
          </p>
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
}
