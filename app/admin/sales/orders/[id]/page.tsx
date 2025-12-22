'use server';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/utils/auth';
import { getOrderById } from '@/lib/queries/orders';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';
import { StatCard } from '@/components/admin/StatCard';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  await requireRole(['admin', 'contributor']);

  const { id: orderId } = await params;

  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  const statusLabel = {
    paid: { label: 'Betaald', color: 'bg-green-100 text-green-800' },
    pending: { label: 'In Behandeling', color: 'bg-yellow-100 text-yellow-800' },
    failed: { label: 'Mislukt', color: 'bg-red-100 text-red-800' },
    cancelled: { label: 'Geannuleerd', color: 'bg-zinc-100 text-zinc-800' },
  };

  const status = statusLabel[order.status as keyof typeof statusLabel] || {
    label: order.status,
    color: 'bg-zinc-100 text-zinc-800',
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-zinc-600 mb-6">
        <Link href="/admin/sales" className="hover:text-primary hover:underline">
          Verkopen & Bestellingen
        </Link>
        <span>/</span>
        <span>Bestelling {order.id.substring(0, 8)}...</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <AdminPageHeader title={`Bestelling: ${order.id.substring(0, 8)}...`} />
        <span
          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${status.color}`}
        >
          {status.label}
        </span>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Bestelnummer" value={order.id.substring(0, 8) + '...'} />
        <StatCard label="Totaal" value={`€${order.totalAmount}`} />
        <StatCard label="Aantal Items" value={order.lineItems.length} />
        <StatCard label="Status" value={status.label} />
      </div>

      {/* Customer Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Klantgegevens</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-600">Naam</p>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">E-mailadres</p>
              <p className="font-medium">{order.customerEmail}</p>
            </div>
            {order.user && (
              <div>
                <p className="text-sm text-zinc-600">Gekoppelde Gebruiker</p>
                <Link href={`/admin/users`} className="text-primary hover:underline">
                  {order.user.name}
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Bestellingdetails</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-zinc-600">Aanmaakdatum</p>
              <p className="font-medium">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleString('nl-NL', {
                      dateStyle: 'long',
                      timeStyle: 'short',
                    })
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Totaalbedrag</p>
              <p className="font-bold text-lg text-primary">€{order.totalAmount}</p>
            </div>
            {order.payments && order.payments.length > 0 && (
              <div>
                <p className="text-sm text-zinc-600">Betalingsmethode</p>
                <p className="font-medium capitalize">{order.payments[0].paymentMethod}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <DataTable
        title="Bestellingsitems"
        headers={['Voorstelling', 'Datum', 'Aantal', 'Prijs per Ticket', 'Totaal']}
      >
        {order.lineItems.length === 0 ? (
          <EmptyRow colSpan={5} message="Geen items in deze bestelling" />
        ) : (
          order.lineItems.map((item, idx) => (
            <tr key={idx} className="hover:bg-zinc-50">
              <td className="px-6 py-4">
                <div className="font-medium text-primary">
                  {item.performance?.show?.title || 'Onbekende voorstelling'}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-zinc-600">
                {item.performance?.date
                  ? new Date(item.performance.date).toLocaleDateString('nl-NL', {
                      dateStyle: 'long',
                    })
                  : '-'}
              </td>
              <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
              <td className="px-6 py-4 text-right font-medium">€{item.pricePerTicket}</td>
              <td className="px-6 py-4 text-right font-bold text-primary">
                €{(item.quantity * Number(item.pricePerTicket)).toFixed(2)}
              </td>
            </tr>
          ))
        )}
      </DataTable>

      {/* Payment Information */}
      {order.payments && order.payments.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Betalingsinformatie</h2>
          <DataTable title="" headers={['Betaalmethode', 'Status', 'Bedrag', 'Datum']}>
            {order.payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4">
                  <span className="capitalize font-medium">{payment.paymentMethod}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'succeeded'
                        ? 'bg-green-100 text-green-800'
                        : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {payment.status === 'succeeded'
                      ? 'Geslaagd'
                      : payment.status === 'pending'
                        ? 'In Behandeling'
                        : 'Mislukt'}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-primary">€{payment.amount}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">
                  {payment.createdAt
                    ? new Date(payment.createdAt).toLocaleString('nl-NL', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '-'}
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}
    </div>
  );
}
