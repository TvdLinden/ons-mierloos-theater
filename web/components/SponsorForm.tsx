'use client';

import { useActionState, useState } from 'react';
import {
  Alert,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SimpleFormField,
} from '@/components/ui';
import { ImageSelector } from './ImageSelector';
import { NumberInput } from './ui/number-input';

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
  const [state, formAction, isPending] = useActionState(action, null);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(initialData?.logoId ?? null);
  const [tier, setTier] = useState<string>(initialData?.tier ?? 'bronze');

  return (
    <form action={formAction} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {state?.error && (
        <Alert variant="destructive" className="lg:col-span-2">
          {state.error}
        </Alert>
      )}

      {/* Left column */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Sponsor details</h2>

          <SimpleFormField label="Naam" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={initialData?.name} required />
          </SimpleFormField>

          <SimpleFormField label="Website URL" htmlFor="website">
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={initialData?.website}
              placeholder="https://example.com"
            />
          </SimpleFormField>

          <div className="space-y-2">
            <Label htmlFor="tier">Sponsor tier *</Label>
            <Select name="tier" value={tier} onValueChange={setTier} required>
              <SelectTrigger id="tier" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gold">Goud</SelectItem>
                <SelectItem value="silver">Zilver</SelectItem>
                <SelectItem value="bronze">Brons</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="tier" value={tier} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayOrder">Volgorde</Label>
            <NumberInput
              id="displayOrder"
              name="displayOrder"
              defaultValue={initialData?.displayOrder ?? 0}
              min={0}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">Lagere nummers worden eerst getoond</p>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="active"
                defaultChecked={initialData?.active === 1}
                className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm font-medium">Actief tonen op website</span>
            </label>
          </div>
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Bezig...' : submitLabel}
        </Button>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-2">
          <ImageSelector
            label="Logo"
            focalPointContext="4:3"
            selectedImageId={selectedLogoId}
            onSelect={setSelectedLogoId}
          />
          <p className="text-sm text-muted-foreground">
            Aanbevolen: PNG met transparante achtergrond
          </p>
          <input type="hidden" name="logoId" value={selectedLogoId ?? ''} />
        </div>
      </div>
    </form>
  );
}
