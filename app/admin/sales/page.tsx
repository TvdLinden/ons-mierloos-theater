import { requireRole } from '@/lib/utils/auth';
import { getAllOrders, getSalesStats, getTicketSalesByPerformance } from '@/lib/queries/orders';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';

export default async function SalesPage() {
  await requireRole(['admin', 'contributor']);

  const [orders, stats, performanceSales] = await Promise.all([
    getAllOrders(),
    getSalesStats(),
    getTicketSalesByPerformance(),
  ]);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <AdminPageHeader title="Verkopen & Bestellingen" />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Totaal Orders" value={stats.totalOrders} />
        <StatCard label="Betaald" value={stats.paidOrders} valueColor="text-green-600" />
        <StatCard label="In Behandeling" value={stats.pendingOrders} valueColor="text-yellow-600" />
        <StatCard label="Totale Omzet" value={`€${stats.totalRevenue}`} />
      </div>

      {/* Performance Sales */}
      <div className="mb-8">
        <DataTable
          title="Verkopen per Voorstelling"
          headers={['Voorstelling', 'Datum', 'Tickets Verkocht', 'Omzet']}
        >
          {performanceSales.length === 0 ? (
            <EmptyRow colSpan={4} message="Nog geen verkopen" />
          ) : (
            performanceSales.map((sale) => (
              <tr key={sale.performanceId} className="hover:bg-zinc-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-primary">{sale.showTitle}</div>
                </td>
                <td className="px-6 py-4 text-zinc-600">
                  {sale.performanceDate
                    ? new Date(sale.performanceDate).toLocaleDateString('nl-NL', {
                        dateStyle: 'long',
                      })
                    : '-'}
                </td>
                <td className="px-6 py-4 text-right font-medium">{sale.totalTickets}</td>
                <td className="px-6 py-4 text-right font-bold text-primary">
                  €{sale.totalRevenue}
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>

      {/* Orders List */}
      <DataTable
        title="Recente Bestellingen"
        headers={['Bestelnummer', 'Klant', 'Datum', 'Items', 'Status', 'Totaal']}
      >
        {orders.length === 0 ? (
          <EmptyRow colSpan={6} message="Nog geen bestellingen" />
        ) : (
          orders.map((order) => (
            <tr key={order.id} className="hover:bg-zinc-50">
              <td className="px-6 py-4">
                <div className="font-mono text-sm text-zinc-600">{order.id.substring(0, 8)}...</div>
              </td>
              <td className="px-6 py-4">
                <div className="font-medium text-primary">{order.customerName}</div>
                <div className="text-sm text-zinc-500">{order.customerEmail}</div>
              </td>
              <td className="px-6 py-4 text-zinc-600 text-sm">
                {new Date(order.createdAt || '').toLocaleString('nl-NL', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm">
                  {order.lineItems.map((item, idx) => (
                    <div key={idx} className="text-zinc-600">
                      {item.quantity}x {item.performance?.show?.title || 'Onbekend'}
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    order.status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : order.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-zinc-100 text-zinc-800'
                  }`}
                >
                  {order.status === 'paid'
                    ? 'Betaald'
                    : order.status === 'pending'
                      ? 'In Behandeling'
                      : order.status === 'failed'
                        ? 'Mislukt'
                        : order.status === 'cancelled'
                          ? 'Geannuleerd'
                          : order.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-bold text-primary">€{order.totalAmount}</td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
