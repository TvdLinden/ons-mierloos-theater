import Link from 'next/link';
import Image from 'next/image';
import { ShowWithTagsAndPerformances } from '@/lib/db';
import { getShowImageUrl } from '@/lib/utils/performanceImages';
import TagsContainer from './TagsContainer';
import DateDisplay from './DateDisplay';

type FeaturedShowCardProps = {
  show: ShowWithTagsAndPerformances;
};

export default function FeaturedShowCard({ show }: FeaturedShowCardProps) {
  const { title, slug, tags, performances, basePrice } = show;
  const imageUrl = getShowImageUrl(show, 'md');

  // Get next upcoming performance
  const nextPerformance = performances
    ?.filter((p) => p.status === 'published' && new Date(p.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // Get the price (performance price overrides base price)
  const price = nextPerformance?.price || basePrice;

  return (
    <Link href={`/voorstellingen/${slug}`} className="group block">
      <div className="bg-surface rounded-lg overflow-hidden shadow hover:shadow-lg transition-all duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-4/3 overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-serif text-lg font-semibold text-primary line-clamp-1 group-hover:text-primary/80 transition-colors">
            {title}
          </h3>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1 justify-start">
              <TagsContainer tags={tags.slice(0, 3)} size="sm" />
            </div>
          )}

          {/* Date */}
          {nextPerformance && (
            <p className="text-sm text-textSecondary mt-2">
              <DateDisplay
                value={nextPerformance.date}
                options={{ weekday: 'short', day: 'numeric', month: 'short' }}
              />
            </p>
          )}

          {/* Price */}
          {price && (
            <p className="text-primary font-semibold mt-2">
              <span className="text-xs text-textSecondary">vanaf </span>
              <span className="text-lg">€{price}</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
