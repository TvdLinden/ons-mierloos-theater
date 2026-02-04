import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { performances, lineItems, orders } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';
import { Button } from '@/components/ui';

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

  // Fetch paid orders for this performance
  const performanceOrders = await db
    .select({
      orderId: orders.id,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      quantity: lineItems.quantity,
      pricePerTicket: lineItems.pricePerTicket,
      createdAt: orders.createdAt,
    })
    .from(lineItems)
    .innerJoin(orders, eq(lineItems.orderId, orders.id))
    .where(and(eq(lineItems.performanceId, performanceId), eq(orders.status, 'paid')))
    .orderBy(desc(orders.createdAt));

  const totalTickets = performanceOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalRevenue = performanceOrders.reduce(
    (sum, o) => sum + Number(o.quantity) * Number(o.pricePerTicket || 0),
    0,
  );
  const soldSeats = (performance.totalSeats || 0) - (performance.availableSeats || 0);

  const dateFormatted = new Date(performance.date).toLocaleString('nl-NL', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

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
            <Link href={`/admin/sales/shows/${performanceId}`}>
              <Button variant="secondary">Verkoop</Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Status"
          value={
            performance.status === 'draft'
              ? 'Concept'
              : performance.status === 'published'
                ? 'Gepubliceerd'
                : performance.status === 'sold_out'
                  ? 'Uitverkocht'
                  : performance.status === 'cancelled'
                    ? 'Geannuleerd'
                    : 'Gearchiveerd'
          }
          valueColor={
            performance.status === 'published'
              ? 'text-green-700'
              : performance.status === 'sold_out'
                ? 'text-red-700'
                : performance.status === 'cancelled'
                  ? 'text-zinc-600'
                  : 'text-yellow-700'
          }
        />
        <StatCard label="Verkochte plaatsen" value={`${soldSeats} / ${performance.totalSeats}`} />
        <StatCard label="Omzet" value={`€${totalRevenue.toFixed(2)}`} />
        <StatCard label="Bestellingen" value={performanceOrders.length} />
      </div>

      {/* Performance details */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Speeltijd details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-sm text-zinc-600">Datum & tijd</p>
            <p className="font-medium">{dateFormatted}</p>
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

      {/* Orders */}
      <DataTable
        title="Bestellingen"
        headers={['Bestelnummer', 'Klant', 'Datum', 'Tickets', 'Prijs per Ticket', 'Totaal']}
      >
        {performanceOrders.length === 0 ? (
          <EmptyRow colSpan={6} message="Nog geen bestellingen voor deze speeltijd" />
        ) : (
          performanceOrders.map((order) => (
            <tr key={order.orderId} className="hover:bg-zinc-50">
              <td className="px-6 py-4">
                <Link href={`/admin/sales/orders/${order.orderId}`}>
                  <div className="font-mono text-sm text-primary hover:underline cursor-pointer">
                    {order.orderId.substring(0, 8)}...
                  </div>
                </Link>
              </td>
              <td className="px-6 py-4">
                <div className="font-medium">{order.customerName}</div>
                <div className="text-sm text-zinc-500">{order.customerEmail}</div>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString('nl-NL', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : '—'}
              </td>
              <td className="px-6 py-4 text-center font-medium">{order.quantity}</td>
              <td className="px-6 py-4 text-right font-medium">€{order.pricePerTicket}</td>
              <td className="px-6 py-4 text-right font-bold text-primary">
                €{(order.quantity * Number(order.pricePerTicket)).toFixed(2)}
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </>
  );
}
