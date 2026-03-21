import Link from 'next/link';
import Image from 'next/image';
import { getShowImageUrl, ShowWithBlurData } from '@/lib/utils/performanceImages';
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';

type FeaturedShowCardProps = {
  show: ShowWithBlurData;
};

export default function FeaturedShowCard({ show }: FeaturedShowCardProps) {
  const { blurDataUrl } = show;
  const { title, slug, performances } = show;
  const imageUrl = getShowImageUrl(show, 'md');

  // Get next upcoming performance
  const nextPerformance = performances
    ?.filter((p) => p.status === 'published' && new Date(p.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // Format date as "ZA 28 SEP" (Dutch, uppercase)
  const formattedDate = nextPerformance
    ? new Intl.DateTimeFormat('nl-NL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
        .format(new Date(nextPerformance.date))
        .toUpperCase()
    : null;

  return (
    <Link
      href={`/voorstellingen/${slug}`}
      className="group block"
      data-component="featured-show-card"
    >
      <div>
        {/* Image with date badge — padding-top 75% enforces 4:3 ratio reliably */}
        <div className="relative overflow-visible" style={{ paddingTop: '75%' }}>
          {/* Separate inner div clips the image */}
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              style={getFocalPointStyle(show.image?.focalPoints, '4:3')}
              placeholder={blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={blurDataUrl ?? undefined}
            />
          </div>

          {/* Date badge — flush bottom-left, barely extends below image */}
          {formattedDate && (
            <div
              className="absolute z-10 px-3 py-2"
              style={{ backgroundColor: '#5a1e2c', bottom: '-12px', left: '0px' }}
            >
              <span
                className="text-white font-bold text-lg tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {formattedDate}
              </span>
            </div>
          )}
        </div>

        {/* Title below image */}
        <div className="pt-4 pb-1 text-center">
          <h3
            className="text-xl uppercase leading-tight line-clamp-2 text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
