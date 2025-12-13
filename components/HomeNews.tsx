import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Markdown from '@/components/ui/markdown';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

import type { NewsArticle } from '@/lib/db';

type HomeNewsProps = {
  articles: NewsArticle[];
  truncate?: (text?: string | null, max?: number) => string;
};

export default function HomeNews({ articles }: HomeNewsProps) {
  const truncate = (text: string | undefined | null, max = 140) => {
    if (!text) return '';
    const t = String(text).trim();
    return t.length > max ? `${t.slice(0, max - 1)}…` : t;
  };

  return (
    <section className="w-screen relative left-[calc(-50vw+50%)] bg-secondary mb-12 h-100">
      <div className="py-12 px-4">
        <h2 className="text-4xl font-bold text-center text-primary mb-8 font-serif">Nieuws</h2>
        <Carousel className="w-full">
          <CarouselContent>
            {articles.map((article) => {
              const plain = (article.content || '')
                .replace(/!\[.*?\]\(.*?\)/g, '')
                .replace(/\[(.*?)\]\(.*?\)/g, '$1')
                .replace(/[#>*_`~\-]{1,}/g, '')
                .replace(/<\/?[^>]+(>|$)/g, '')
                .replace(/\s+/g, ' ')
                .trim();

              const titleTruncated = truncate(article.title, 80);
              const excerpt = truncate(plain, 80);

              return (
                <CarouselItem key={article.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
                    {article.imageId ? (
                      <div className="relative w-full h-48 bg-muted">
                        <Image
                          src={`/api/images/${article.imageId}`}
                          alt={article.title || 'Afbeelding'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ) : null}
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg truncate" title={article.title}>
                        {titleTruncated}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString('nl-NL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : ''}
                      </p>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm text-muted-foreground mb-4 text-wrap">
                        {excerpt ? <span>{excerpt}</span> : <Markdown content={article.content} />}
                      </div>
                      <div className="flex justify-end">
                        <Link href={`/nieuws/${article.id}`}>
                          <button className="text-primary underline">Lees meer</button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </section>
  );
}
