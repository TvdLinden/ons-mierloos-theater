import ShowDetail from '@/components/PerformanceDetail';
import TimeslotPicker from '@/components/TimeslotPicker';
import { getShowBySlugWithTagsAndPerformances } from '@/lib/queries/shows';
import { notFound } from 'next/navigation';

export default async function PerformancePage({ params }: { params: Promise<{ slug: string }> }) {
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
