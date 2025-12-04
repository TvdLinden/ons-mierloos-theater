'use server';
import Link from 'next/link';
import { getAllShows } from '@/lib/queries/shows';
import { updateShow } from '@/lib/commands/shows';
import { requireRole } from '@/lib/utils/auth';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable, EmptyRow, Row } from '@/components/admin/DataTable';
import { Inbox } from 'lucide-react';

export default async function AdminPerformanceOverview() {
  await requireRole(['admin', 'contributor']);
  const shows = await getAllShows();
  const publishedPerformances = shows.filter((performance) => performance.status === 'published');
  const unpublishedPerformances = shows.filter((performance) => performance.status !== 'published');

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <AdminPageHeader
        title="Voorstellingen Beheer"
        action={{
          href: '/admin/performances/add',
          label: 'Nieuwe voorstelling toevoegen',
        }}
      />
      {shows.length === 0 ? (
        <div className="text-center text-zinc-500 py-8">Er zijn geen voorstellingen gevonden.</div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Gepubliceerd</h2>
            <Table shows={publishedPerformances} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-primary">Ongepubliceerd</h2>
            <Table shows={unpublishedPerformances} />
          </div>
        </>
      )}
    </div>
  );
}

import type { Show, ShowWithTagsAndPerformances } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { invalidatePerformancePaths } from '@/lib/utils/invalidatePerformancePaths';
import { Button, Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui';

function Table({ shows }: { shows: ShowWithTagsAndPerformances[] }) {
  async function handleStatusChange(id: string, targetStatus: 'published' | 'draft') {
    'use server';
    // Find the performance object
    const show = shows.find((p) => p.id === id);
    const updateFields: Partial<Show> = { status: targetStatus };
    // if publicationDate is not set and targetStatus is Published, set publicationDate to now
    if (targetStatus === 'published' && !show?.publicationDate) {
      updateFields.publicationDate = new Date();
    }
    // if depublicationDate is set and targetStatus is Draft, clear depublicationDate
    if (targetStatus === 'draft' && show?.depublicationDate) {
      updateFields.depublicationDate = null;
    }
    await updateShow(id, updateFields);
    revalidatePath('/admin/shows');
    invalidatePerformancePaths(id);
  }
  return (
    <DataTable
      headers={[
        'Titel',
        'Ondertitel',
        'Prijs',
        'Status',
        'Publicatiedatum',
        'Depublicatiedatum',
        'Acties',
      ]}
    >
      {shows.length === 0 ? (
        <EmptyRow colSpan={7} message="Geen voorstellingen in deze groep" />
      ) : (
        shows.map((show) => {
          const isPublished = show.status === 'published';
          const actionLabel = isPublished ? 'Maak concept' : 'Publiceer';
          const targetStatus = isPublished ? 'draft' : 'published';
          const publicationDate = show.publicationDate
            ? new Date(show.publicationDate).toLocaleDateString('nl-NL')
            : '-';
          const depublicationDate = show.depublicationDate
            ? new Date(show.depublicationDate).toLocaleDateString('nl-NL')
            : '-';
          return (
            <tr key={show.id} className="hover:bg-zinc-50">
              <td className="px-6 py-4">
                <div className="font-medium text-primary">{show.title}</div>
              </td>
              <td className="px-6 py-4 text-zinc-600 text-sm">{show.subtitle || '-'}</td>
              <td className="px-6 py-4 text-zinc-600 text-sm">€{show.basePrice || '0.00'}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded text-sm font-semibold ${
                    isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {isPublished ? 'Gepubliceerd' : 'Concept'}
                </span>
              </td>
              <td className="px-6 py-4 text-zinc-600 text-sm">{publicationDate}</td>
              <td className="px-6 py-4 text-zinc-600 text-sm">{depublicationDate}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Link href={`/admin/shows/edit/${show.id}`}>
                    <Button type="button" variant="default">
                      Bewerken
                    </Button>
                  </Link>
                  <form action={handleStatusChange.bind(null, show.id, targetStatus)}>
                    <Button type="submit" variant="secondary">
                      {actionLabel}
                    </Button>
                  </form>
                </div>
              </td>
            </tr>
          );
        })
      )}
    </DataTable>
  );
}
