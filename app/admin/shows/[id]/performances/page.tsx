import { requireRole } from '@/lib/utils/auth';
import { getShowByIdWithPerformances } from '@/lib/queries/shows';
import { redirect, notFound } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';
import { insertPerformance } from '@/lib/commands/shows';
import AddPerformanceToShowForm from '@/components/AddPerformanceToShowForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShowPerformancesPage({ params }: Props) {
  await requireRole(['admin', 'contributor']);
  const { id } = await params;

  const show = await getShowByIdWithPerformances(id);
  if (!show) {
    notFound();
  }

  async function handleAddPerformance(prevState: { error?: string }, formData: FormData) {
    'use server';

    const date = formData.get('date') as string;
    const price = formData.get('price') as string;
    const rows = formData.get('rows') as string;
    const seatsPerRow = formData.get('seatsPerRow') as string;
    const status = formData.get('status') as string;
    const publicationDate = formData.get('publicationDate') as string;
    const depublicationDate = formData.get('depublicationDate') as string;
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
      await insertPerformance({
        showId: id,
        date: new Date(date),
        price: price || show.basePrice,
        rows: rowsNum,
        seatsPerRow: seatsPerRowNum,
        totalSeats: totalSeats,
        availableSeats: totalSeats,
        status:
          (status as 'draft' | 'published' | 'sold_out' | 'cancelled' | 'archived') || 'draft',
        notes: notes || null,
      });

      redirect(`/admin/shows/${id}/performances`);
    } catch (error) {
      console.error('Error adding performance:', error);
      return { error: 'Opslaan mislukt.' };
    }
  }

  return (
    <>
      <AdminPageHeader
        title={show.title}
        subtitle={show.subtitle || undefined}
        breadcrumbs={[
          { label: 'Voorstellingen', href: '/admin/shows' },
          { label: 'Speeltijden' },
        ]}
        action={
          <Link href={`/admin/shows/edit/${id}`}>
            <Button variant="secondary">Bewerk voorstelling</Button>
          </Link>
        }
      />

      <Card className="mb-8 p-6">
        <p className="text-sm text-gray-500">Basisprijs: €{show.basePrice}</p>
      </Card>

      <Card className="mb-8 p-6">
        <h2 className="text-2xl font-bold mb-4">Nieuwe speeltijd toevoegen</h2>
        <AddPerformanceToShowForm
          action={handleAddPerformance}
          showBasePrice={show.basePrice || '0'}
        />
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Speeltijden</h2>
        {show.performances && show.performances.length > 0 ? (
          <div className="space-y-4">
            {show.performances.map((performance) => (
              <div
                key={performance.id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {new Date(performance.date).toLocaleString('nl-NL', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Prijs: €{performance.price} | Beschikbaar: {performance.availableSeats}/
                    {performance.totalSeats} plaatsen
                  </p>
                  <p className="text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded ${
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
                  </p>
                  {performance.notes && (
                    <p className="text-sm text-gray-500 mt-1">{performance.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/performances/edit/${performance.id}`}>
                    <Button variant="secondary" size="sm">
                      Bewerk
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nog geen speeltijden toegevoegd.</p>
        )}
      </Card>
    </>
  );
}
