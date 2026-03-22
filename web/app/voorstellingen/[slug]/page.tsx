import type { Metadata, ResolvingMetadata } from 'next';
import { cache } from 'react';
import Image from 'next/image';
import ShowDetail from '@/components/PerformanceDetail';
import TimeslotPicker from '@/components/TimeslotPicker';
import ShareButtons from '@/components/ShareButtons';
import MobileBookingBar from '@/components/MobileBookingBar';
import Tag from '@/components/Tag';
import { getShowBySlugWithTagsAndPerformances } from '@ons-mierloos-theater/shared/queries/shows';
import { getImageUrl } from '@ons-mierloos-theater/shared/utils/image-url';
import { getShowImageUrl } from '@/lib/utils/performanceImages';
import { getFocalPointStyle } from '@ons-mierloos-theater/shared/utils/focalPoints';
import { notFound } from 'next/navigation';

const cachedGetShow = cache(getShowBySlugWithTagsAndPerformances);

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const show = await cachedGetShow(slug);

  if (!show) {
    return {};
  }

  const title = show.title || 'Voorstelling';
  const description = show.subtitle || 'Bekijk deze voorstelling op Ons Mierloos Theater';
  const imageUrl = show.imageId ? getImageUrl(show.imageId) : undefined;
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://onsmierloos.nl'}/voorstellingen/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function PerformancePage({ params }: Props) {
  const { slug } = await params;
  const show = await cachedGetShow(slug);

  if (!show) {
    return notFound();
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://onsmierloos.nl'}/voorstellingen/${slug}`;

  const imageUrl = getShowImageUrl(show, 'lg');

  return (
    <div
      className="min-h-screen pb-20 lg:pb-0"
      style={{ backgroundColor: 'var(--color-parchment)' }}
    >
      {/* White spacer above the image */}
      <div className="bg-white h-8" />

      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        {/* Two-column: image (left) + booking panel (right) */}
        <div className="flex flex-col lg:flex-row lg:h-[440px] lg:items-stretch">
          {/* Image */}
          <div className="relative w-full lg:w-[60%] h-64 lg:h-full shrink-0">
            <Image
              src={imageUrl}
              alt={show.title || 'Voorstelling'}
              fill
              priority
              className="object-cover"
              style={getFocalPointStyle(show.image?.focalPoints, '4:3')}
            />
          </div>

          {/* Booking panel — slightly taller than image, centered vertically to hover above/below */}
          <div
            className="w-full lg:w-[40%] border border-border flex flex-col p-6 gap-4 overflow-y-auto bg-white lg:-translate-x-3 lg:shadow-2xl"
            style={{ height: 'calc(100% + 32px)', marginTop: '-16px' }}
          >
            <div>
              <h2
                className="font-bold uppercase leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {show.title}
              </h2>
              {show.tags && show.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {show.tags.map((tag) => (
                    <Tag key={tag.id} tag={tag} size="sm" />
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <TimeslotPicker performances={show.performances || []} showTitle={show.title || ''} />
            </div>
          </div>
        </div>

        {/* Title + subtitle below the image panel */}
        <div className="mt-8 mb-6">
          <h2
            className="text-4xl md:text-5xl font-bold uppercase leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {show.title}
          </h2>
          {show.subtitle && (
            <p className="text-2xl md:text-3xl mt-2" style={{ fontFamily: 'var(--font-display)' }}>
              &lsquo;{show.subtitle}&rsquo;
            </p>
          )}
        </div>

        {/* Content blocks */}
        <ShowDetail show={show} fullWidth />

        {/* Share strip */}
        {/* <div className="mt-12 border-t border-border pt-6">
          <ShareButtons url={shareUrl} title={show.title || 'Voorstelling'} />
        </div> */}
      </div>

      {/* Mobile booking bar */}
      <MobileBookingBar performances={show.performances || []} />
    </div>
  );
}
