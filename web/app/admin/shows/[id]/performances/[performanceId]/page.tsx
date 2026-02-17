import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@ons-mierloos-theater/shared/db';
import { performances, orders, tickets } from '@ons-mierloos-theater/shared/db/schema';
import { eq, and } from 'drizzle-orm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui';
import { SeatMapDisplay } from './SeatMapDisplay';

type Props = {
  params: Promise<{ id: string; performanceId: string }>;
};

export default async function PerformanceDetailPage({ params }: Props) {
  const { id: showId, performanceId } = await params;

  // Fetch performance with show — verify it belongs to this show
  const performance = await db.query.performances.findFirst({
    where: and(eq(performances.id, performanceId), eq(performances.showId, showId)),
    with: { show: true },
  });

  if (!performance || !performance.show) {
    notFound();
  }

  // Fetch assigned seats for this performance (all orders with tickets)
  const assignedTickets = await db
    .select({
      rowLetter: tickets.rowLetter,
      seatNumber: tickets.seatNumber,
      wheelchairAccess: tickets.wheelchairAccess,
      customerName: orders.customerName,
      orderId: orders.id,
      orderStatus: orders.status,
    })
    .from(tickets)
    .innerJoin(orders, eq(tickets.orderId, orders.id))
    .where(eq(tickets.performanceId, performanceId));

  // Convert to arrays/maps for JSON serialization
  const reservedSeats = assignedTickets.map(
    (t) => `${t.rowLetter.charCodeAt(0) - 65}-${t.seatNumber}`,
  );
  const wheelchairSeats = assignedTickets
    .filter((t) => t.wheelchairAccess)
    .map((t) => `${t.rowLetter.charCodeAt(0) - 65}-${t.seatNumber}`);

  // Build seat info map: seatId -> { customerName, orderId, orderStatus }
  const seatInfo: Record<string, { customerName: string; orderId: string; orderStatus: string }> =
    {};
  for (const t of assignedTickets) {
    const seatId = `${t.rowLetter.charCodeAt(0) - 65}-${t.seatNumber}`;
    seatInfo[seatId] = {
      customerName: t.customerName,
      orderId: t.orderId,
      orderStatus: t.orderStatus,
    };
  }

  const dateFormatted = new Date(performance.date).toLocaleString('nl-NL', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const statusLabels = {
    draft: 'Concept',
    published: 'Gepubliceerd',
    sold_out: 'Uitverkocht',
    cancelled: 'Geannuleerd',
    archived: 'Gearchiveerd',
  };

  const statusColors = {
    draft: 'text-yellow-700',
    published: 'text-green-700',
    sold_out: 'text-red-700',
    cancelled: 'text-zinc-600',
    archived: 'text-zinc-600',
  };

  return (
    <>
      <AdminPageHeader
        title={dateFormatted}
        subtitle={performance.show.title}
        breadcrumbs={[
          { label: 'Voorstellingen', href: '/admin/shows' },
          { label: performance.show.title, href: `/admin/shows/${showId}` },
          { label: 'Speeltijden', href: `/admin/shows/${showId}/performances` },
          { label: dateFormatted },
        ]}
        action={
          <div className="flex gap-2">
            <Link href={`/admin/shows/${showId}/performances/${performanceId}/edit`}>
              <Button variant="outline">Bewerken</Button>
            </Link>
            <Link href={`/admin/sales/shows/${showId}/performances/${performanceId}`}>
              <Button variant="outline">Verkoop</Button>
            </Link>
          </div>
        }
      />

      {/* Performance Info Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Speeltijd details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-sm text-zinc-600">Datum & tijd</p>
            <p className="font-medium">{dateFormatted}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Status</p>
            <p
              className={`font-medium ${statusColors[performance.status as keyof typeof statusColors]}`}
            >
              {statusLabels[performance.status as keyof typeof statusLabels]}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Prijs</p>
            <p className="font-medium">
              €{performance.price || performance.show.basePrice || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Rijen</p>
            <p className="font-medium">{performance.rows}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Plaatsen per rij</p>
            <p className="font-medium">{performance.seatsPerRow}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Totaal plaatsen</p>
            <p className="font-medium">{performance.totalSeats}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Beschikbaar</p>
            <p className="font-medium">{performance.availableSeats}</p>
          </div>
          {performance.notes && (
            <div className="md:col-span-2">
              <p className="text-sm text-zinc-600">Opmerkingen</p>
              <p className="font-medium">{performance.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Seat Map Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Zitplaatsen</h2>
        <SeatMapDisplay
          rows={performance.rows || 5}
          seatsPerRow={performance.seatsPerRow || 20}
          reservedSeats={reservedSeats}
          wheelchairSeats={wheelchairSeats}
          seatInfo={seatInfo}
        />
      </div>
    </>
  );
}
