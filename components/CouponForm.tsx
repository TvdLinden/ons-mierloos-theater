'use client';

import { useActionState } from 'react';
import { useState } from 'react';
import FormError from './FormError';
import type { Coupon } from '@/lib/db';
import { NumberInput } from './ui/number-input';

interface CouponFormProps {
  initialData?: Partial<Coupon>;
  action: (
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
  ) => Promise<{ error?: string; success?: boolean }>;
  submitLabel: string;
}

export default function CouponForm({ initialData, action, submitLabel }: CouponFormProps) {
  const [state, formAction] = useActionState(action, null);
  const [discountType, setDiscountType] = useState<string>(
    initialData?.discountType || 'percentage',
  );

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-lg border border-border p-6 space-y-6">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-text-primary mb-2">
            Coupon Code *
          </label>
          <input
            type="text"
            id="code"
            name="code"
            defaultValue={initialData?.code}
            required
            placeholder="ZOMER2025"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
            style={{ textTransform: 'uppercase' }}
          />
          <p className="text-sm text-text-secondary mt-1">Unieke code (hoofdletters)</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
            Beschrijving
          </label>
          <textarea
            id="description"
            name="description"
            defaultValue={initialData?.description || ''}
            rows={3}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="10% korting op alle voorstellingen"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="discountType"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Kortingstype *
            </label>
            <select
              id="discountType"
              name="discountType"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              required
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Vast bedrag</option>
              <option value="free_tickets">Gratis kaartjes</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="discountValue"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              {discountType === 'percentage'
                ? 'Percentage *'
                : discountType === 'fixed'
                  ? 'Bedrag (€) *'
                  : 'Aantal kaartjes *'}
            </label>
            <NumberInput
              id="discountValue"
              name="discountValue"
              defaultValue={Number(initialData?.discountValue) || 0}
              required
              step={discountType === 'percentage' ? 1 : 0.01}
              min={0}
              max={discountType === 'percentage' ? 100 : undefined}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="minOrderAmount"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Minimum orderbedrag (€)
          </label>
          <NumberInput
            id="minOrderAmount"
            name="minOrderAmount"
            defaultValue={Number(initialData?.minOrderAmount) || 0}
            step={0.01}
            min={0}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="0.00"
          />
          <p className="text-sm text-text-secondary mt-1">Optioneel: laat leeg voor geen minimum</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="maxUses" className="block text-sm font-medium text-text-primary mb-2">
              Max aantal keer te gebruiken
            </label>
            <NumberInput
              id="maxUses"
              name="maxUses"
              defaultValue={Number(initialData?.maxUses) || 0}
              min={1}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Onbeperkt"
            />
          </div>

          <div>
            <label
              htmlFor="maxUsesPerUser"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Max per gebruiker
            </label>
            <NumberInput
              id="maxUsesPerUser"
              name="maxUsesPerUser"
              defaultValue={Number(initialData?.maxUsesPerUser) || 0}
              min={1}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Onbeperkt"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="validFrom" className="block text-sm font-medium text-text-primary mb-2">
              Geldig vanaf
            </label>
            <input
              type="datetime-local"
              id="validFrom"
              name="validFrom"
              defaultValue={
                initialData?.validFrom
                  ? new Date(initialData.validFrom).toISOString().slice(0, 16)
                  : ''
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="validUntil"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Geldig tot
            </label>
            <input
              type="datetime-local"
              id="validUntil"
              name="validUntil"
              defaultValue={
                initialData?.validUntil
                  ? new Date(initialData.validUntil).toISOString().slice(0, 16)
                  : ''
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialData?.isActive === 1 || initialData?.isActive === undefined}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-primary">Actief</span>
          </label>
        </div>
      </div>

      {state?.error && <FormError error={state.error} />}

      <button
        type="submit"
        className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
      >
        {submitLabel}
      </button>
    </form>
  );
}
