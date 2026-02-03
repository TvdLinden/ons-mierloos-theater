'use server';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/utils/auth';
import { db } from '@/lib/db';
import { performances, shows, lineItems, orders, tickets } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';
import { StatCard } from '@/components/admin/StatCard';

interface ShowSalesPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShowSalesDetailPage({ params }: ShowSalesPageProps) {
  await requireRole(['admin', 'contributor']);

  const { id: performanceId } = await params;

  // Fetch performance with show data
  const performance = await db.query.performances.findFirst({
    where: eq(performances.id, performanceId),
    with: {
      show: true,
    },
  });

  if (!performance || !performance.show) {
    notFound();
  }

  // Fetch all orders for this performance
  const performanceOrders = await db
    .select({
      orderId: orders.id,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      quantity: lineItems.quantity,
      pricePerTicket: lineItems.pricePerTicket,
      wheelchairAccess: lineItems.wheelchairAccess,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(lineItems)
    .innerJoin(orders, eq(lineItems.orderId, orders.id))
    .where(and(eq(lineItems.performanceId, performanceId), eq(orders.status, 'paid')))
    .orderBy(desc(orders.createdAt));

  const totalTickets = performanceOrders.reduce((sum, order) => sum + order.quantity, 0);
  const totalRevenue = performanceOrders.reduce(
    (sum, order) => sum + Number(order.quantity || 0) * Number(order.pricePerTicket || 0),
    0,
  );

  const wheelchairCount = performanceOrders.filter((o) => o.wheelchairAccess).length;

  // Fetch wheelchair seat assignments (tickets already generated at this point)
  const wheelchairBookings = await db
    .select({
      customerName: orders.customerName,
      rowLetter: tickets.rowLetter,
      seatNumber: tickets.seatNumber,
    })
    .from(lineItems)
    .innerJoin(orders, eq(lineItems.orderId, orders.id))
    .innerJoin(tickets, eq(tickets.lineItemId, lineItems.id))
    .where(
      and(
        eq(lineItems.performanceId, performanceId),
        eq(lineItems.wheelchairAccess, true),
        eq(orders.status, 'paid'),
      ),
    )
    .orderBy(tickets.rowLetter, tickets.seatNumber);

  const wheelchairByCustomer = new Map<string, string[]>();
  for (const booking of wheelchairBookings) {
    const seat = `${booking.rowLetter}${booking.seatNumber}`;
    const existing = wheelchairByCustomer.get(booking.customerName) || [];
    existing.push(seat);
    wheelchairByCustomer.set(booking.customerName, existing);
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-zinc-600 mb-6">
        <Link href="/admin/sales" className="hover:text-primary hover:underline">
          Verkopen & Bestellingen
        </Link>
        <span>/</span>
        <span>{performance.show.title}</span>
      </div>

      <AdminPageHeader title={`Verkopen: ${performance.show.title}`} />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Totaal Tickets Verkocht" value={totalTickets} />
        <StatCard label="Totale Omzet" value={`€${totalRevenue}`} />
        <StatCard label="Aantal Bestellingen" value={performanceOrders.length} />
        <StatCard label="Rolstoel" value={wheelchairCount} />
      </div>

      {/* Wheelchair bookings */}
      {wheelchairByCustomer.size > 0 && (
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-lg font-semibold mb-3">Rolstoel plaatsen</h2>
          <div className="space-y-2">
            {Array.from(wheelchairByCustomer.entries()).map(([name, seats]) => (
              <div key={name} className="flex items-center gap-3">
                <span className="font-mono font-medium text-sm">{seats.join(', ')}</span>
                <span className="text-zinc-400">—</span>
                <span className="text-zinc-600 text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Details */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <h2 className="text-lg font-semibold mb-4">Voorstelling Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-zinc-600">Titel</p>
            <p className="font-medium">{performance.show.title}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-600">Datum & Tijd</p>
            <p className="font-medium">
              {performance.date
                ? new Date(performance.date).toLocaleString('nl-NL', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })
                : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <DataTable
        title="Bestellingen voor deze Voorstelling"
        headers={['Bestelnummer', 'Klant', 'Datum', 'Tickets', 'Prijs per Ticket', 'Totaal']}
      >
        {performanceOrders.length === 0 ? (
          <EmptyRow colSpan={6} message="Nog geen bestellingen voor deze voorstelling" />
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
                <div className="font-medium text-primary">{order.customerName}</div>
                <div className="text-sm text-zinc-500">{order.customerEmail}</div>
                {order.wheelchairAccess && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                    Rolstoel
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString('nl-NL', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : '-'}
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
    </div>
  );
}
