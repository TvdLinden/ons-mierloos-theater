import { redirect } from 'next/navigation';
import { createCoupon } from '@/lib/commands/coupons';
import CouponForm from '@/components/CouponForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { requireRole } from '@/lib/utils/auth';

async function handleAddCoupon(
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

    await createCoupon({
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
    console.error('Error creating coupon:', error);
    return { error: 'Er is een fout opgetreden bij het toevoegen van de coupon' };
  }

  redirect('/admin/coupons');
}

export default async function AddCouponPage() {
  await requireRole(['admin']);

  return (
    <>
      <AdminPageHeader
        title="Coupon toevoegen"
        breadcrumbs={[
          { label: 'Coupons', href: '/admin/coupons' },
          { label: 'Toevoegen' },
        ]}
      />
      <div className="bg-surface rounded-lg shadow p-8">
        <CouponForm action={handleAddCoupon} submitLabel="Coupon toevoegen" />
      </div>
    </>
  );
}
