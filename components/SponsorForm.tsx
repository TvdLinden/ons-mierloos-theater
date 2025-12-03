'use client';

import { useActionState } from 'react';
import { useState } from 'react';
import FormError from './FormError';
import Image from 'next/image';

interface SponsorFormProps {
  initialData?: {
    name: string;
    logoId: string | null;
    website: string;
    tier: 'gold' | 'silver' | 'bronze';
    displayOrder: number;
    active: number;
  };
  action: (
    prevState: { error?: string; success?: boolean } | null,
    formData: FormData,
  ) => Promise<{ error?: string; success?: boolean }>;
  submitLabel: string;
}

export default function SponsorForm({ initialData, action, submitLabel }: SponsorFormProps) {
  const [state, formAction] = useActionState(action, null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (file: File | null) => {
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-lg border border-border p-6 space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
            Sponsor naam *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={initialData?.name}
            required
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Logo</label>
          <input
            type="file"
            name="logoFile"
            accept="image/*"
            onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {(previewUrl || initialData?.logoId) && (
            <div className="mt-4 relative w-full max-w-md">
              <Image
                src={previewUrl || `/api/images/${initialData?.logoId}`}
                alt="Logo preview"
                width={400}
                height={225}
                className="rounded-lg border border-border object-contain bg-white"
              />
            </div>
          )}
          <p className="text-sm text-text-secondary mt-1">
            Aanbevolen: PNG met transparante achtergrond
          </p>
          {initialData?.logoId && (
            <input type="hidden" name="existingLogoId" value={initialData.logoId} />
          )}
        </div>

        <div>
          <label htmlFor="website" className="block text-sm font-medium text-text-primary mb-2">
            Website URL
          </label>
          <input
            type="url"
            id="website"
            name="website"
            defaultValue={initialData?.website}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="tier" className="block text-sm font-medium text-text-primary mb-2">
            Sponsor tier *
          </label>
          <select
            id="tier"
            name="tier"
            defaultValue={initialData?.tier || 'bronze'}
            required
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="gold">Goud</option>
            <option value="silver">Zilver</option>
            <option value="bronze">Brons</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="displayOrder"
            className="block text-sm font-medium text-text-primary mb-2"
          >
            Volgorde
          </label>
          <input
            type="number"
            id="displayOrder"
            name="displayOrder"
            defaultValue={initialData?.displayOrder ?? 0}
            min="0"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-sm text-text-secondary mt-1">Lagere nummers worden eerst getoond</p>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="active"
              defaultChecked={initialData?.active === 1}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm font-medium text-text-primary">Actief tonen op website</span>
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
