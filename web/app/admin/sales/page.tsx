import { requireRole } from '@/lib/utils/auth';
import {
  getAllOrders,
  getSalesStats,
  getTicketSalesByPerformance,
} from '@ons-mierloos-theater/shared/queries/orders';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { PerformanceSalesTable } from './PerformanceSalesTable';
import { OrderSearchClient } from './OrderSearchClient';

export default async function SalesPage() {
  await requireRole(['admin', 'contributor']);

  const [orders, stats, performanceSales] = await Promise.all([
    getAllOrders(),
    getSalesStats(),
    getTicketSalesByPerformance(),
  ]);

  return (
    <>
      <AdminPageHeader title="Verkopen & Bestellingen" breadcrumbs={[{ label: 'Verkopen' }]} />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Totaal Orders" value={stats.totalOrders} />
        <StatCard label="Betaald" value={stats.paidOrders} valueColor="text-green-600" />
        <StatCard label="In Behandeling" value={stats.pendingOrders} valueColor="text-yellow-600" />
        <StatCard label="Totale Omzet" value={`€${stats.totalRevenue}`} />
      </div>

      {/* Performance Sales */}
      <div className="mb-8">
        <PerformanceSalesTable sales={performanceSales} />
      </div>

      {/* Orders List */}
      <OrderSearchClient />
    </>
  );
}
