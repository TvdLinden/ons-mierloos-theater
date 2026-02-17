import { getShowByIdWithPerformances } from '@ons-mierloos-theater/shared/queries/shows';
import { redirect, notFound } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import Link from 'next/link';
import { insertPerformance, deletePerformance } from '@ons-mierloos-theater/shared/commands/shows';
import AddPerformanceSection from '@/components/AddPerformanceSection';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { performanceFormSchema } from '@/lib/schemas/performance';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShowPerformancesPage({ params }: Props) {
  const { id } = await params;

  const show = await getShowByIdWithPerformances(id);
  if (!show) {
    notFound();
  }

  async function handleAddPerformance(prevState: { error?: string }, formData: FormData) {
    'use server';

    const validationResult = performanceFormSchema.safeParse({
      date: formData.get('date'),
      price: formData.get('price'),
      rows: formData.get('rows'),
      seatsPerRow: formData.get('seatsPerRow'),
      status: formData.get('status'),
      notes: formData.get('notes'),
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return { error: firstError?.message || 'Validatiefout.' };
    }

    const { date, price, rows, seatsPerRow, status, notes } = validationResult.data;
    const totalSeats = rows * seatsPerRow;

    try {
      await insertPerformance({
        showId: id,
        date: new Date(date),
        price: price || show.basePrice,
        rows,
        seatsPerRow,
        totalSeats,
        availableSeats: totalSeats,
        status,
        notes: notes || null,
      });

      redirect(`/admin/shows/${id}/performances`);
    } catch (error) {
      console.error('Error adding performance:', error);
      return { error: 'Opslaan mislukt.' };
    }
  }

  async function handleDeletePerformance(performanceId: string) {
    'use server';
    try {
      await deletePerformance(performanceId);
      redirect(`/admin/shows/${id}/performances`);
    } catch (error) {
      console.error('Error deleting performance:', error);
    }
  }

  return (
    <>
      <AdminPageHeader
        title={show.title}
        subtitle={show.subtitle || undefined}
        breadcrumbs={[
          { label: 'Voorstellingen', href: '/admin/shows' },
          { label: show.title, href: `/admin/shows/${id}` },
          { label: 'Speeltijden' },
        ]}
        action={
          <Link href={`/admin/shows/edit/${id}`}>
            <Button variant="outline">Bewerk voorstelling</Button>
          </Link>
        }
      />

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Speeltijden</h2>
        {show.performances && show.performances.length > 0 ? (
          <div className="space-y-4">
            {show.performances.map((performance) => (
              <div
                key={performance.id}
                className="border rounded-lg p-4 flex justify-between items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary">
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
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/admin/shows/${id}/performances/${performance.id}`}>
                    <Button variant="ghost" size="sm">
                      Detail
                    </Button>
                  </Link>
                  <Link href={`/admin/shows/${id}/performances/${performance.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Bewerken
                    </Button>
                  </Link>
                  <form action={handleDeletePerformance.bind(null, performance.id)}>
                    <Button type="submit" variant="destructive" size="sm">
                      Verwijderen
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nog geen speeltijden toegevoegd.</p>
        )}
      </Card>

      <AddPerformanceSection action={handleAddPerformance} showBasePrice={show.basePrice || '0'} />
    </>
  );
}
