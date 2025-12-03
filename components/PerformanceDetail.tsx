import Image from 'next/image';
import CurrencyDisplay from '@/components/CurrencyDisplay';
import { ShowWithTagsAndPerformances } from '@/lib/db';
import { getShowImageUrl } from '@/lib/utils/performanceImages';
import TagsContainer from './TagsContainer';

export type ShowDetailProps = {
  show: ShowWithTagsAndPerformances;
  children?: React.ReactNode;
};

export default function ShowDetail({ show, children }: ShowDetailProps) {
  const { title, subtitle, description, basePrice: price } = show;
  const imageUrl = getShowImageUrl(show);
  return (
    <div className="max-w-xl w-full bg-surface dark:bg-accent rounded-lg shadow p-8 flex flex-col items-center">
      {show.imageId && (
        <Image
          src={imageUrl}
          alt={title || 'Preview'}
          width={320}
          height={180}
          className="rounded mb-6 object-cover"
        />
      )}
      <h1 className="text-3xl font-bold text-primary dark:text-secondary mb-2 font-display">
        {title || <span className="text-accent">Titel</span>}
      </h1>
      {subtitle && (
        <p className="text-lg text-text-secondary dark:text-gray-300 mb-3 text-center">
          {subtitle}
        </p>
      )}
      {/* <p className="text-accent dark:text-surface mb-2">
        {date ? (
          <DateDisplay value={date} options={{ dateStyle: 'short', timeStyle: 'short' }} />
        ) : (
          <span className="text-accent">Datum</span>
        )}
      </p> */}
      <TagsContainer tags={show.tags} size="md" />
      <p className="text-accent dark:text-surface mb-6 text-center">
        {description || <span className="text-accent">Beschrijving</span>}
      </p>
      {price && (
        <p className="mt-2 text-lg font-bold text-primary">
          Prijs: <CurrencyDisplay value={price} />
        </p>
      )}
      {children}
    </div>
  );
}
