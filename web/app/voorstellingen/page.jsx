import {
  getUpcomingShows,
  getUpcomingShowsCount,
} from '@ons-mierloos-theater/shared/queries/shows';
import FeaturedShowCard from '@/components/FeaturedShowCard';
import PaginationBar from '@/components/PaginationBar';
import { buildHref } from '@/lib/utils/pagination';

const ITEMS_PER_PAGE = 9;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShowsPage({ searchParams }) {
  const search = await searchParams;
  const selectedTags = search?.tags ? search.tags.split(',') : [];
  const selectedMonth = search?.month || null;
  const page = Math.max(1, search?.page ? parseInt(search.page, 10) : 1);

  const offset = (page - 1) * ITEMS_PER_PAGE;
  const tagFilter = selectedTags.length > 0 ? selectedTags : undefined;

  const [shows, totalCount] = await Promise.all([
    getUpcomingShows(offset, ITEMS_PER_PAGE, tagFilter, selectedMonth),
    getUpcomingShowsCount(tagFilter, selectedMonth),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const hrefFor = (newPage) =>
    buildHref('/voorstellingen', newPage, {
      tags: selectedTags.length > 0 ? selectedTags.join(',') : null,
      month: selectedMonth,
    });

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <main className="grow w-full max-w-7xl flex-col items-center justify-between py-16 px-8 mx-auto sm:items-start">
        <section id="performances" className="w-full mb-12">
          <h1 className="text-5xl font-bold text-center text-primary mb-10">Voorstellingen</h1>

          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {shows.length === 0 ? (
              <div className="col-span-full text-center text-primary/70">
                Er zijn momenteel geen voorstellingen beschikbaar.
              </div>
            ) : (
              shows.map((show) => <FeaturedShowCard key={show.id} show={show} />)
            )}
          </div>

          <div className="mt-12">
            <PaginationBar page={page} totalPages={totalPages} buildHref={hrefFor} />
          </div>
        </section>
      </main>
    </div>
  );
}
