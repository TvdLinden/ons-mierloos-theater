'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';
import { getShowImageUrl } from '@/lib/utils/performanceImages';
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from '@/components/ui/carousel';
import { ShowWithBlurData } from '@/lib/utils/performanceImages';

type HeroCarouselProps = {
  shows: ShowWithBlurData[];
  autoplayDelay?: number;
};

export default function HeroCarousel({ shows, autoplayDelay = 5000 }: HeroCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

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

  if (showsWithImages.length === 0) return null;

  const currentShow = showsWithImages[current];

  const now = new Date();

  const nextPerformance = currentShow?.performances
    ?.filter((p) => p.status === 'published' && new Date(p.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const nextSoldOut = !nextPerformance
    ? currentShow?.performances
        ?.filter((p) => p.status === 'sold_out' && new Date(p.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    : null;

  const datePerformance = nextPerformance ?? nextSoldOut;

  const isPast =
    !nextPerformance &&
    !nextSoldOut &&
    (currentShow?.performances?.every((p) => new Date(p.date) <= now) ?? true);

  const formattedDate = datePerformance
    ? new Intl.DateTimeFormat('nl-NL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
        .format(new Date(datePerformance.date))
        .toUpperCase()
    : null;

  return (
    <section className="w-screen relative left-[calc(-50vw+50%)] mb-8">
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
          {showsWithImages.map((show, index) => (
            <CarouselItem key={show.id}>
              <div className="relative aspect-[4/3] md:aspect-[21/9] w-full overflow-hidden">
                <Image
                  src={getShowImageUrl(show, 'lg')}
                  alt={show.title}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                  className="object-cover"
                  style={getFocalPointStyle(show.image?.focalPoints, '21:9')}
                  placeholder={show.blurDataUrl ? 'blur' : 'empty'}
                  blurDataURL={show.blurDataUrl ?? undefined}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="left-4 md:left-8 bg-white/20 hover:bg-white/40 border-none text-white z-20" />
        <CarouselNext className="right-4 md:right-8 bg-white/20 hover:bg-white/40 border-none text-white z-20" />

        {/* Dots — top of image so they're never behind the maroon card */}
        {count > 1 && (
          <div className="absolute top-4 md:top-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === current ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Maroon card — single combined box, floats over the image bottom-left */}
        <Link
          href={`/voorstellingen/${currentShow?.slug}`}
          className="absolute bottom-4 md:bottom-10 md:left-10 z-10 block group w-fit max-w-[80%] md:max-w-[60%]"
        >
          <div
            className="px-6 md:px-8 py-4 md:py-6 transition-[filter] group-hover:brightness-110"
            style={{ backgroundColor: 'var(--color-maroon)' }}
          >
            {formattedDate && (
              <span
                className="block text-white text-xs font-bold tracking-widest uppercase mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {formattedDate}
              </span>
            )}
            <h2
              className="text-2xl md:text-3xl lg:text-4xl uppercase leading-tight text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {currentShow?.title}
            </h2>
            {nextSoldOut && (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-bold tracking-widest uppercase bg-white/20 text-white">
                Uitverkocht
              </span>
            )}
            {isPast && (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-bold tracking-widest uppercase bg-white/20 text-white">
                Pas gespeeld
              </span>
            )}
          </div>
        </Link>
      </Carousel>
    </section>
  );
}
