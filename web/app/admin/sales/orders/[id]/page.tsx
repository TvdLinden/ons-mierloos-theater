'use server';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/utils/auth';
import { getOrderById } from '@ons-mierloos-theater/shared/queries/orders';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';
import { StatCard } from '@/components/admin/StatCard';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/order-status-badge';

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

  return (
    <>
      <AdminPageHeader
        title={`Bestelling: ${order.id.substring(0, 8)}...`}
        breadcrumbs={[
          { label: 'Verkopen', href: '/admin/sales' },
          { label: `Bestelling ${order.id.substring(0, 8)}...` },
        ]}
        action={<OrderStatusBadge status={order.status} />}
      />

      {/* Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Bestelnummer" value={order.id.substring(0, 8) + '...'} />
        <StatCard label="Totaal" value={`€${order.totalAmount}`} />
        <StatCard label="Aantal Items" value={order.lineItems.length} />
        <StatCard label="Status" value={order.status} />
      </div>

      {/* Customer Information & Order Details */}
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
            {/* Coupon Usage */}
            {order.couponUsages && order.couponUsages.length > 0 && (
              <div>
                <p className="text-sm text-zinc-600 mb-1">Gebruikte kortingscodes</p>
                <ul className="list-disc list-inside">
                  {order.couponUsages.map((usage) => (
                    <li key={usage.id}>
                      <span className="font-medium">{usage.coupon?.code}</span>
                      {usage.coupon?.discountType === 'fixed' && usage.coupon?.discountValue && (
                        <span className="ml-2 text-green-700 font-semibold">
                          -€{usage.coupon.discountValue}
                        </span>
                      )}
                      {usage.coupon?.discountType === 'percentage' &&
                        usage.coupon?.discountValue && (
                          <span className="ml-2 text-green-700 font-semibold">
                            -{usage.coupon.discountValue}%
                          </span>
                        )}
                      {usage.coupon?.discountType === 'free_tickets' &&
                        usage.coupon?.discountValue && (
                          <span className="ml-2 text-green-700 font-semibold">
                            +{usage.coupon.discountValue} gratis ticket
                            {Number(usage.coupon.discountValue) > 1 ? 's' : ''}
                          </span>
                        )}
                      {usage.discountAmount && (
                        <span className="ml-2 text-green-800">
                          (Korting toegepast: -€{usage.discountAmount})
                        </span>
                      )}
                      {usage.coupon?.description && (
                        <span className="ml-2 text-zinc-500">{usage.coupon.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
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
                  <PaymentStatusBadge status={payment.status} />
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
    </>
  );
}
