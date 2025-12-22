import Link from 'next/link';
import { requireRole } from '@/lib/utils/auth';
import { getAllOrders, getSalesStats, getTicketSalesByPerformance } from '@/lib/queries/orders';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';
import { OrderSearchClient } from './OrderSearchClient';

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
                  <Link href={`/admin/sales/shows/${sale.performanceId}`}>
                    <div className="font-medium text-primary hover:underline cursor-pointer">
                      {sale.showTitle}
                    </div>
                  </Link>
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
      <OrderSearchClient />
    </div>
  );
}
