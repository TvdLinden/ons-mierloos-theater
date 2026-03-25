import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import NewsCard, { type NewsArticleWithImage } from '@/components/NewsCard';

type HomeNewsProps = {
  articles: NewsArticleWithImage[];
};

export default function HomeNews({ articles }: HomeNewsProps) {
  return (
    <section
      className="w-screen relative left-[calc(-50vw+50%)] py-16 md:py-20"
      data-section="home-news"
    >
      <div className="max-w-7xl mx-auto px-8">
        <h2
          className="text-5xl md:text-6xl lg:text-7xl uppercase leading-none text-foreground mb-10"
          style={{ fontFamily: 'var(--font-display)' }}
          data-element="section-title"
        >
          Nieuws
        </h2>

        <Carousel className="w-full">
          <CarouselContent className="-ml-6 items-stretch">
            {articles.map((article) => (
              <CarouselItem key={article.id} className="pl-6 md:basis-1/2 lg:basis-1/3 flex flex-col">
                <NewsCard article={article} />
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="flex gap-3 mt-8">
            <CarouselPrevious className="relative bg-transparent hover:bg-accent border-none text-foreground" />
            <CarouselNext className="relative bg-transparent hover:bg-accent border-none text-foreground" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
