import type { Metadata, ResolvingMetadata } from 'next';
import { cache } from 'react';
import ShowDetail from '@/components/PerformanceDetail';
import TimeslotPicker from '@/components/TimeslotPicker';
import ShowHero from '@/components/ShowHero';
import PerformanceSummary from '@/components/PerformanceSummary';
import ShareButtons from '@/components/ShareButtons';
import MobileBookingBar from '@/components/MobileBookingBar';
import { getShowBySlugWithTagsAndPerformances } from '@ons-mierloos-theater/shared/queries/shows';
import { getImageUrl } from '@ons-mierloos-theater/shared/utils/image-url';
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

  return (
    <div className="min-h-screen bg-surface pb-20 lg:pb-0">
      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <ShowHero show={show} />
      </div>

      {/* Performance summary strip */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <PerformanceSummary performances={show.performances || []} />
      </div>

      {/* Content + Sidebar */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          <ShowDetail show={show} />
          <div className="lg:sticky lg:top-6">
            <TimeslotPicker performances={show.performances || []} showTitle={show.title || ''} />
          </div>
        </div>
      </div>

      {/* Share strip */}
      <div className="max-w-6xl mx-auto px-4 mt-12">
        <div className="border-t border-border pt-6">
          <ShareButtons url={shareUrl} title={show.title || 'Voorstelling'} />
        </div>
      </div>

      {/* Mobile booking bar */}
      <MobileBookingBar performances={show.performances || []} />
    </div>
  );
}
