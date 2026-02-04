import { redirect, notFound } from 'next/navigation';
import { getCouponById } from '@ons-mierloos-theater/shared/queries/coupons';
import { updateCoupon, deleteCoupon } from '@ons-mierloos-theater/shared/commands/coupons';
import CouponForm from '@/components/CouponForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireRole } from '@/lib/utils/auth';

async function handleUpdateCoupon(
  id: string,
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  'use server';

  try {
    const code = formData.get('code') as string;
    const description = formData.get('description') as string;
    const discountType = formData.get('discountType') as 'percentage' | 'fixed' | 'free_tickets';
    const discountValue = formData.get('discountValue') as string;
    const minOrderAmount = formData.get('minOrderAmount') as string;
    const maxUses = formData.get('maxUses') as string;
    const maxUsesPerUser = formData.get('maxUsesPerUser') as string;
    const validFrom = formData.get('validFrom') as string;
    const validUntil = formData.get('validUntil') as string;
    const isActive = formData.get('isActive') === 'on' ? 1 : 0;

    if (!code || !discountType || !discountValue) {
      return { error: 'Code, kortingstype en waarde zijn verplicht' };
    }

    await updateCoupon(id, {
      code,
      description: description || null,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || null,
      maxUses: maxUses ? parseInt(maxUses, 10) : null,
      maxUsesPerUser: maxUsesPerUser ? parseInt(maxUsesPerUser, 10) : null,
      validFrom: validFrom ? new Date(validFrom) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      isActive,
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    return { error: 'Er is een fout opgetreden bij het bijwerken van de coupon' };
  }

  redirect('/admin/coupons');
}

async function handleDeleteCoupon(id: string) {
  'use server';
  await deleteCoupon(id);
  redirect('/admin/coupons');
}

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['admin']);
  const { id } = await params;
  const coupon = await getCouponById(id);

  if (!coupon) {
    notFound();
  }

  const boundUpdateAction = handleUpdateCoupon.bind(null, id);
  const boundDeleteAction = handleDeleteCoupon.bind(null, id);

  return (
    <>
      <AdminPageHeader
        title="Coupon bewerken"
        breadcrumbs={[{ label: 'Coupons', href: '/admin/coupons' }, { label: coupon.code }]}
      />
      <div className="bg-surface rounded-lg shadow p-8">
        <CouponForm
          initialData={coupon}
          action={boundUpdateAction}
          submitLabel="Coupon bijwerken"
        />

        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold text-error mb-4">Gevaarzone</h3>
          <p className="text-text-secondary mb-4">
            Het verwijderen van een coupon kan niet ongedaan worden gemaakt. Let op: bestaande
            orders met deze coupon blijven behouden.
          </p>
          <form action={boundDeleteAction}>
            <button
              type="submit"
              className="bg-error text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Coupon verwijderen
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
