import Image from 'next/image';
import DateDisplay from '@/components/DateDisplay';
import Link from 'next/link';
import { ShowWithTagsAndPerformances, Tag } from '@/lib/db';
import { getShowThumbnailUrl } from '@/lib/utils/performanceImages';
import TagsContainer from './TagsContainer';

export type PerformanceCardProps = {
  show: ShowWithTagsAndPerformances;
  tags?: Tag[];
  href?: string;
};

export default function PerformanceCard({ show: show, href }: PerformanceCardProps) {
  const { title, subtitle, slug, tags, performances } = show;
  const imageUrl = getShowThumbnailUrl(show);

  // Get available (published) performances sorted by date
  const availablePerformances = performances
    ?.filter((p) => p.status === 'published' && p.availableSeats > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dateDisplay =
    availablePerformances && availablePerformances.length > 0
      ? availablePerformances.length === 1
        ? new Date(availablePerformances[0].date)
        : `${availablePerformances.length} data`
      : null;

  return (
    <Link
      href={href || `/performances/${slug}`}
      className="flex flex-col bg-surface dark:bg-accent rounded-xl shadow-lg overflow-hidden hover:ring-4 hover:ring-secondary transition-all border border-border dark:border-primary"
      style={{ textDecoration: 'none' }}
    >
      <div className="relative w-full aspect-4/3">
        <Image src={imageUrl} alt={title || 'Show'} fill unoptimized className="object-cover" />
      </div>
      <div className="p-4 flex flex-col items-center">
        <h2 className="text-xl font-bold text-primary dark:text-secondary mb-1 font-display">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-text-secondary dark:text-gray-300 mb-2">{subtitle}</p>
        )}
        {dateDisplay && (
          <div className="text-secondary font-medium text-sm mb-1">
            {typeof dateDisplay === 'string' ? (
              dateDisplay
            ) : (
              <DateDisplay
                value={dateDisplay}
                options={{ dateStyle: 'medium', timeStyle: 'short' }}
              />
            )}
          </div>
        )}
        <TagsContainer tags={tags} size="sm" />
      </div>
    </Link>
  );
}
