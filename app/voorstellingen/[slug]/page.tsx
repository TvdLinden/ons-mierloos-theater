import type { Metadata, ResolvingMetadata } from 'next';
import ShowDetail from '@/components/PerformanceDetail';
import TimeslotPicker from '@/components/TimeslotPicker';
import { getShowBySlugWithTagsAndPerformances } from '@/lib/queries/shows';
import { getImageUrl } from '@/lib/utils/image-url';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const show = await getShowBySlugWithTagsAndPerformances(slug);

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
  const show = await getShowBySlugWithTagsAndPerformances(slug);

  if (!show) {
    return notFound();
  }

  return (
    <div className="flex justify-center py-12 bg-surface min-h-screen px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
        <div className="flex justify-center">
          <ShowDetail show={show} />
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-xl flex flex-col items-center">
            <TimeslotPicker performances={show.performances || []} showTitle={show.title || ''} />
          </div>
        </div>
      </div>
    </div>
  );
}
