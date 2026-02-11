import Image from 'next/image';
import { ShowWithTagsAndPerformances } from '@ons-mierloos-theater/shared/db';
import { getShowImageUrl } from '@/lib/utils/performanceImages';
import Tag from './Tag';

export type ShowHeroProps = {
  show: ShowWithTagsAndPerformances;
};

export default function ShowHero({ show }: ShowHeroProps) {
  const { title, subtitle, tags } = show;
  const hasImage = !!show.imageId;

  return (
    <div
      className={`relative w-full aspect-[3/2] sm:aspect-[16/7] sm:rounded-xl overflow-hidden ${
        hasImage ? '' : 'bg-primary/10'
      }`}
    >
      {hasImage && (
        <>
          <Image
            src={getShowImageUrl(show, 'lg')}
            alt={title || 'Voorstelling'}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </>
      )}

      <div
        className={`absolute inset-0 flex flex-col justify-end p-6 sm:p-10 ${
          hasImage ? 'text-white' : 'text-foreground'
        }`}
      >
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <Tag key={tag.id} tag={tag} size="sm" />
            ))}
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display leading-tight">
          {title || 'Titel'}
        </h1>

        {subtitle && (
          <p
            className={`text-lg sm:text-xl mt-2 ${hasImage ? 'text-white/85' : 'text-muted-foreground'}`}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
