import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ChevronRight } from 'lucide-react';
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';

import type { NewsArticle, Image as ImageType } from '@ons-mierloos-theater/shared/db';

type NewsArticleWithImage = NewsArticle & {
  image?: ImageType | null;
  blurDataUrl?: string | null;
};

type HomeNewsProps = {
  articles: NewsArticleWithImage[];
};

export default function HomeNews({ articles }: HomeNewsProps) {
  const truncate = (text: string | undefined | null, max = 100) => {
    if (!text) return '';
    const t = String(text).trim();
    return t.length > max ? `${t.slice(0, max)}…` : t;
  };

  const extractPlainText = (content: string) => {
    return (content || '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[#>*_`~\-]{1,}/g, '')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  return (
    <section
      className="w-screen relative left-[calc(-50vw+50%)] py-24 px-4 bg-gradient-to-b from-primary/10 via-primary/5 to-background"
      data-section="home-news"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-16">
          <h2
            className="text-5xl md:text-6xl font-bold text-primary mb-4 tracking-tight"
            data-element="section-title"
          >
            Nieuws
          </h2>
          <div
            className="w-20 h-1.5 bg-gradient-to-r from-primary to-primary/60 rounded-full"
            data-element="accent-bar"
          ></div>
        </div>

        {/* Carousel */}
        <Carousel className="w-full">
          <CarouselContent className="gap-6">
            {articles.map((article) => {
              const plain = extractPlainText(article.content);
              const dateStr = article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString('nl-NL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '';

              return (
                <CarouselItem key={article.id} className="md:basis-1/2 lg:basis-1/3 pl-0">
                  <Link href={`/nieuws/${article.slug}`} className="group h-full block">
                    <Card className="overflow-hidden h-full border-0 shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white dark:bg-slate-950">
                      {/* Image Container */}
                      {article.imageId && (
                        <div className="relative w-full h-64 bg-muted overflow-hidden">
                          <Image
                            src={`/api/images/${article.imageId}`}
                            alt={article.title || 'Afbeelding'}
                            fill
                            className="object-cover transition-transform duration-600 ease-out group-hover:scale-108"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            style={getFocalPointStyle(article.image?.focalPoints, '4:3')}
                            placeholder={article.blurDataUrl ? 'blur' : 'empty'}
                            blurDataURL={article.blurDataUrl ?? undefined}
                          />
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-400 group-hover:opacity-75" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6 flex flex-col">
                        {/* Title */}
                        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>

                        {/* Date */}
                        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">
                          {dateStr}
                        </p>

                        {/* Excerpt */}
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6 grow line-clamp-3">
                          {truncate(plain, 100)}
                        </p>

                        {/* Read More Link */}
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded border border-primary text-primary font-semibold hover:bg-primary hover:text-white transition-all duration-300">
                          Lees meer
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* Custom Navigation */}
          <div className="flex gap-3 justify-center md:justify-end mt-8">
            <CarouselPrevious className="relative w-12 h-12 rounded-full border-2 border-primary/30 hover:border-primary bg-transparent hover:bg-primary/10 text-primary transition-all duration-300 hover:scale-110 active:scale-95" />
            <CarouselNext className="relative w-12 h-12 rounded-full border-2 border-primary/30 hover:border-primary bg-transparent hover:bg-primary/10 text-primary transition-all duration-300 hover:scale-110 active:scale-95" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
