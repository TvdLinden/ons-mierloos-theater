import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getShowByIdWithTagsAndPerformances } from '@ons-mierloos-theater/shared/queries/shows';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShowDetailPage({ params }: Props) {
  const { id } = await params;

  const show = await getShowByIdWithTagsAndPerformances(id);
  if (!show) {
    notFound();
  }

  const isPublished = show.status === 'published';
  const upcomingPerformances = show.performances.filter(
    (p) => new Date(p.date) >= new Date() && p.status === 'published',
  );
  const totalSeats = show.performances.reduce((sum, p) => sum + (p.totalSeats || 0), 0);
  const availableSeats = show.performances.reduce((sum, p) => sum + (p.availableSeats || 0), 0);
  const soldTickets = totalSeats - availableSeats;

  return (
    <>
      <AdminPageHeader
        title={show.title}
        subtitle={show.subtitle || undefined}
        breadcrumbs={[{ label: 'Voorstellingen', href: '/admin/shows' }, { label: show.title }]}
        action={
          <div className="flex gap-2">
            <Link href={`/admin/shows/${id}/performances`}>
              <Button variant="secondary">Speeltijden</Button>
            </Link>
            <Link href={`/admin/shows/edit/${id}`}>
              <Button variant="default">Bewerken</Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Status"
          value={isPublished ? 'Gepubliceerd' : 'Concept'}
          valueColor={isPublished ? 'text-green-700' : 'text-yellow-700'}
        />
        <StatCard label="Basisprijs" value={`€${show.basePrice || '0.00'}`} />
        <StatCard label="Speeltijden" value={show.performances.length} />
        <StatCard label="Tags" value={show.tags.length} />
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Voorstelling details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-sm text-zinc-600">Titel</p>
            <p className="font-medium">{show.title}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Ondertitel</p>
            <p className="font-medium">{show.subtitle || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Slug</p>
            <p className="font-mono text-sm">{show.slug}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Publieke pagina</p>
            <Link
              href={`/voorstellingen/${show.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              /voorstellingen/{show.slug}
            </Link>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Publicatiedatum</p>
            <p className="font-medium">
              {show.publicationDate
                ? new Date(show.publicationDate).toLocaleDateString('nl-NL', { dateStyle: 'long' })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Depublicatiedatum</p>
            <p className="font-medium">
              {show.depublicationDate
                ? new Date(show.depublicationDate).toLocaleDateString('nl-NL', {
                    dateStyle: 'long',
                  })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Aangemaakt</p>
            <p className="font-medium">
              {show.createdAt
                ? new Date(show.createdAt).toLocaleDateString('nl-NL', { dateStyle: 'long' })
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Laatst bijgewerkt</p>
            <p className="font-medium">
              {show.updatedAt
                ? new Date(show.updatedAt).toLocaleDateString('nl-NL', { dateStyle: 'long' })
                : '—'}
            </p>
          </div>
        </div>

        {show.tags.length > 0 && (
          <div className="mt-6 pt-4 border-t border-zinc-200">
            <p className="text-sm text-zinc-600 mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {show.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-block px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-700 text-sm"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Performances overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Speeltijden</h2>
          <Link
            href={`/admin/shows/${id}/performances`}
            className="text-primary hover:underline text-sm"
          >
            Alle speeltijden beheren
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-50 rounded-lg p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Komend</p>
            <p className="text-xl font-bold">{upcomingPerformances.length}</p>
          </div>
          <div className="bg-zinc-50 rounded-lg p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Totaal plaatsen</p>
            <p className="text-xl font-bold">{totalSeats}</p>
          </div>
          <div className="bg-zinc-50 rounded-lg p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Verkocht</p>
            <p className="text-xl font-bold">{soldTickets}</p>
          </div>
          <div className="bg-zinc-50 rounded-lg p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Beschikbaar</p>
            <p className="text-xl font-bold">{availableSeats}</p>
          </div>
        </div>

        {show.performances.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nog geen speeltijden toegevoegd.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {show.performances.slice(0, 5).map((performance) => {
              const sold = (performance.totalSeats || 0) - (performance.availableSeats || 0);
              const pct = performance.totalSeats
                ? Math.round((sold / performance.totalSeats) * 100)
                : 0;
              return (
                <Link
                  key={performance.id}
                  href={`/admin/shows/${id}/performances/${performance.id}/edit`}
                  className="flex items-center gap-4 py-3 hover:bg-zinc-50 -mx-2 px-2 rounded"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary">
                      {new Date(performance.date).toLocaleString('nl-NL', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          performance.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : performance.status === 'sold_out'
                              ? 'bg-red-100 text-red-800'
                              : performance.status === 'cancelled'
                                ? 'bg-zinc-100 text-zinc-800'
                                : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {performance.status === 'draft' && 'Concept'}
                        {performance.status === 'published' && 'Gepubliceerd'}
                        {performance.status === 'sold_out' && 'Uitverkocht'}
                        {performance.status === 'cancelled' && 'Geannuleerd'}
                        {performance.status === 'archived' && 'Gearchiveerd'}
                      </span>
                      <span className="text-xs text-zinc-400">€{performance.price}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium">
                      {sold}{' '}
                      <span className="text-zinc-400 font-normal">
                        / {performance.totalSeats} verkocht
                      </span>
                    </p>
                    <div className="mt-1 h-1.5 w-28 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{pct}% bezet</p>
                  </div>
                </Link>
              );
            })}
            {show.performances.length > 5 && (
              <Link
                href={`/admin/shows/${id}/performances`}
                className="text-primary hover:underline text-sm"
              >
                En nog {show.performances.length - 5} meer...
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
