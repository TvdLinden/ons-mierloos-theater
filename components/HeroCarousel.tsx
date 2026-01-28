'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Autoplay from 'embla-carousel-autoplay';
import { ShowWithTagsAndPerformances } from '@/lib/db';
import { getShowImageUrl } from '@/lib/utils/performanceImages';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';

type HeroCarouselProps = {
  shows: ShowWithTagsAndPerformances[];
  autoplayDelay?: number;
};

export default function HeroCarousel({ shows, autoplayDelay = 5000 }: HeroCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Filter to shows that have images
  const showsWithImages = shows.filter((show) => show.imageId);

  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  if (showsWithImages.length === 0) {
    return null;
  }

  return (
    <section className="w-screen relative left-[calc(-50vw+50%)] mb-12">
      <Carousel
        setApi={setApi}
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: autoplayDelay,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full"
      >
        <CarouselContent>
          {showsWithImages.map((show) => (
            <CarouselItem key={show.id}>
              <div className="relative aspect-[4/3] md:aspect-[21/9] w-full overflow-hidden">
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${getShowImageUrl(show, 'lg')})` }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 lg:p-16">
                  <div className="max-w-3xl">
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white font-serif mb-2 md:mb-4 drop-shadow-lg">
                      {show.title}
                    </h2>
                    {show.subtitle && (
                      <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-4 md:mb-6 drop-shadow-md">
                        {show.subtitle}
                      </p>
                    )}
                    <Link href={`/voorstellingen/${show.slug}`}>
                      <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                        Info & bestel kaarten
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Navigation Arrows */}
        <CarouselPrevious className="left-4 md:left-8 bg-white/20 hover:bg-white/40 border-none text-white" />
        <CarouselNext className="right-4 md:right-8 bg-white/20 hover:bg-white/40 border-none text-white" />

        {/* Dots Navigation */}
        {count > 1 && (
          <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                  index === current ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </Carousel>
    </section>
  );
}
