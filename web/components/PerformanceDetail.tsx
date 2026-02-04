import Image from 'next/image';
import { ShowWithTagsAndPerformances } from '@ons-mierloos-theater/shared/db';
import { getShowImageUrl } from '@/lib/utils/performanceImages';
import TagsContainer from './TagsContainer';
import { BlockRenderer } from './BlockRenderer';
import { BlocksArray } from '@ons-mierloos-theater/shared/schemas/blocks';

export type ShowDetailProps = {
  show: ShowWithTagsAndPerformances;
  children?: React.ReactNode;
};

export default function ShowDetail({ show, children }: ShowDetailProps) {
  const { title, subtitle, blocks } = show;
  const imageUrl = getShowImageUrl(show);
  return (
    <div className="max-w-xl w-full p-8 flex flex-col items-center">
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
      <BlockRenderer blocks={blocks as BlocksArray} />
      {children}
    </div>
  );
}
