import Link from 'next/link';
import { getAllCoupons } from '@/lib/queries/coupons';
import { requireRole } from '@/lib/utils/auth';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';
import type { Coupon } from '@/lib/db';

export default async function AdminCouponsPage() {
  await requireRole(['admin']);
  const coupons = await getAllCoupons();

  const activeCoupons = coupons.filter((c) => c.isActive === 1);
  const inactiveCoupons = coupons.filter((c) => c.isActive === 0);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <AdminPageHeader
        title="Coupons Beheer"
        action={{
          href: '/admin/coupons/add',
          label: 'Nieuwe coupon toevoegen',
        }}
      />

      {coupons.length === 0 ? (
        <div className="text-center text-zinc-500 py-8">Er zijn geen coupons gevonden.</div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-primary">Actief</h2>
            <CouponsTable coupons={activeCoupons} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-primary">Inactief</h2>
            <CouponsTable coupons={inactiveCoupons} />
          </div>
        </>
      )}
    </div>
  );
}

function CouponsTable({ coupons }: { coupons: Coupon[] }) {
  return (
    <DataTable
      headers={['Code', 'Beschrijving', 'Type', 'Waarde', 'Gebruikt', 'Geldig tot', 'Acties']}
    >
      {coupons.length === 0 ? (
        <EmptyRow colSpan={7} message="Geen coupons in deze groep" />
      ) : (
        coupons.map((coupon) => {
          const discountDisplay =
            coupon.discountType === 'percentage'
              ? `${coupon.discountValue}%`
              : coupon.discountType === 'fixed'
                ? `€${coupon.discountValue}`
                : `${coupon.discountValue} kaartjes`;

          const usageDisplay = coupon.maxUses
            ? `${coupon.usageCount}/${coupon.maxUses}`
            : coupon.usageCount;

          const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();

          return (
            <tr key={coupon.id} className="hover:bg-zinc-50">
              <td className="px-6 py-4">
                <div className="font-medium text-primary font-mono">{coupon.code}</div>
              </td>
              <td className="px-6 py-4 text-zinc-600 max-w-xs truncate">
                {coupon.description || '-'}
              </td>
              <td className="px-6 py-4 text-zinc-600 capitalize">
                {coupon.discountType === 'percentage'
                  ? 'Percentage'
                  : coupon.discountType === 'fixed'
                    ? 'Vast bedrag'
                    : 'Gratis kaartjes'}
              </td>
              <td className="px-6 py-4 text-zinc-600">{discountDisplay}</td>
              <td className="px-6 py-4 text-zinc-600">{usageDisplay}</td>
              <td className="px-6 py-4 text-zinc-600">
                {coupon.validUntil ? (
                  <span className={isExpired ? 'text-red-600' : ''}>
                    {new Date(coupon.validUntil).toLocaleDateString('nl-NL', {
                      dateStyle: 'medium',
                    })}
                  </span>
                ) : (
                  'Onbeperkt'
                )}
              </td>
              <td className="px-6 py-4">
                <Link
                  href={`/admin/coupons/edit/${coupon.id}`}
                  className="text-primary hover:text-secondary transition-colors"
                >
                  Bewerken
                </Link>
              </td>
            </tr>
          );
        })
      )}
    </DataTable>
  );
}
