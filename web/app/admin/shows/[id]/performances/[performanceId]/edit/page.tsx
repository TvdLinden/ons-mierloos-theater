import { db } from '@ons-mierloos-theater/shared/db';
import { performances } from '@ons-mierloos-theater/shared/db/schema';
import { eq } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { updatePerformance } from '@ons-mierloos-theater/shared/commands/shows';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import PerformanceForm from '@/components/PerformanceForm';
import { Card } from '@/components/ui';

type Props = {
  params: Promise<{ id: string; performanceId: string }>;
};

export default async function EditPerformancePage({ params }: Props) {
  const { id: showId, performanceId } = await params;

  // Fetch performance with show relationship
  const performance = await db.query.performances.findFirst({
    where: eq(performances.id, performanceId),
    with: {
      show: true,
    },
  });

  if (!performance || performance.showId !== showId) {
    notFound();
  }

  async function handleUpdatePerformance(prevState: { error?: string }, formData: FormData) {
    'use server';

    const date = formData.get('date') as string;
    const price = formData.get('price') as string;
    const rows = formData.get('rows') as string;
    const seatsPerRow = formData.get('seatsPerRow') as string;
    const status = formData.get('status') as string;
    const notes = formData.get('notes') as string;

    if (!date) {
      return { error: 'Datum en tijd zijn verplicht.' };
    }

    if (price && (isNaN(Number(price)) || !/^\d+(\.\d{1,2})?$/.test(price))) {
      return { error: 'Prijs moet een geldig decimaal getal zijn (max 2 decimalen).' };
    }

    const rowsNum = rows ? parseInt(rows) : 5;
    const seatsPerRowNum = seatsPerRow ? parseInt(seatsPerRow) : 20;
    const totalSeats = rowsNum * seatsPerRowNum;

    try {
      await updatePerformance(performanceId, {
        date: new Date(date),
        price: price || undefined,
        rows: rowsNum,
        seatsPerRow: seatsPerRowNum,
        totalSeats: totalSeats,
        status:
          (status as 'draft' | 'published' | 'sold_out' | 'cancelled' | 'archived') || 'draft',
        notes: notes || null,
      });
    } catch (error) {
      console.error('Error updating performance:', error);
      return { error: 'Opslaan mislukt.' };
    }

    redirect(`/admin/shows/${showId}/performances`);
  }

  return (
    <>
      <AdminPageHeader
        title={performance.show?.title || 'Voorstelling'}
        subtitle="Speeltijd bewerken"
        breadcrumbs={[
          { label: 'Voorstellingen', href: '/admin/shows' },
          { label: performance.show?.title || '', href: `/admin/shows/${showId}` },
          { label: 'Speeltijden', href: `/admin/shows/${showId}/performances` },
          { label: 'Bewerken' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Basisgegevens</h2>
          <PerformanceForm
            action={handleUpdatePerformance}
            performance={performance}
            backHref={`/admin/shows/${showId}/performances`}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-6">Informatie</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                Huidige datum & tijd
              </p>
              <p className="font-medium text-primary">
                {new Date(performance.date).toLocaleString('nl-NL', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                Totale zitplaatsen
              </p>
              <p className="font-medium text-primary">{performance.totalSeats}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                Beschikbare plaatsen
              </p>
              <p className="font-medium text-primary">{performance.availableSeats}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
                Verkochte kaarten
              </p>
              <p className="font-medium text-primary">
                {(performance.totalSeats || 0) - (performance.availableSeats || 0)}
              </p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Status</p>
              <span
                className={`inline-block px-2 py-1 rounded text-sm ${
                  performance.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : performance.status === 'sold_out'
                      ? 'bg-red-100 text-red-800'
                      : performance.status === 'cancelled'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {performance.status === 'draft' && 'Concept'}
                {performance.status === 'published' && 'Gepubliceerd'}
                {performance.status === 'sold_out' && 'Uitverkocht'}
                {performance.status === 'cancelled' && 'Geannuleerd'}
                {performance.status === 'archived' && 'Gearchiveerd'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
