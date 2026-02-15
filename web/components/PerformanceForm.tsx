'use client';

import { useActionState } from 'react';
import { Button, SimpleFormField as FormField } from '@/components/ui';
import FormError from './FormError';
import StatusSelector from './StatusSelector';
import { DateTimePicker } from './date-time-picker';
import Textarea from './Textarea';
import { NumberInput } from './ui/number-input';
import { Performance } from '@ons-mierloos-theater/shared/db';
import Link from 'next/link';

type PerformanceFormProps = {
  action: (prevState: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
  performance?: Performance;
  showBasePrice?: string;
  backHref?: string;
  onCancel?: () => void;
};

export default function PerformanceForm({
  action,
  performance,
  showBasePrice,
  backHref,
  onCancel,
}: PerformanceFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  const isEdit = !!performance;

  return (
    <form action={formAction} className="space-y-6">
      <FormField label="Datum en tijd" required>
        <DateTimePicker
          name="date"
          defaultValue={isEdit ? new Date(performance.date).toISOString().slice(0, 16) : undefined}
          required
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Prijs (€)"
          helperText={
            showBasePrice
              ? `Laat leeg om de basisprijs (€${showBasePrice}) te gebruiken`
              : 'Standaard indien leeg'
          }
        >
          <NumberInput
            name="price"
            step={0.01}
            min={0}
            defaultValue={isEdit ? parseFloat(performance.price || '0') : undefined}
            placeholder={showBasePrice}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Status" required>
          <StatusSelector
            name="status"
            defaultValue={performance?.status ?? 'draft'}
            options={[
              { value: 'draft', label: 'Concept' },
              { value: 'published', label: 'Gepubliceerd' },
              { value: 'sold_out', label: 'Uitverkocht' },
              { value: 'cancelled', label: 'Geannuleerd' },
              { value: 'archived', label: 'Gearchiveerd' },
            ]}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Aantal rijen" required>
          <NumberInput
            name="rows"
            min={1}
            max={26}
            defaultValue={performance?.rows ?? 5}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Stoelen per rij" required>
          <NumberInput
            name="seatsPerRow"
            min={1}
            defaultValue={performance?.seatsPerRow ?? 20}
            disabled={isPending}
          />
        </FormField>
      </div>

      <FormField
        label="Notities"
        helperText="Interne aantekeningen (niet zichtbaar voor bezoekers)"
      >
        <Textarea
          name="notes"
          placeholder="Bijv. Extra matinee, Special pricing"
          defaultValue={performance?.notes ?? ''}
          rows={2}
        />
      </FormField>

      {state.error && <FormError error={state.error} />}

      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? 'Opslaan...'
              : 'Toevoegen...'
            : isEdit
              ? 'Opslaan'
              : 'Speeltijd toevoegen'}
        </Button>
        {backHref && (
          <Link href={backHref}>
            <Button type="button" variant="outline" disabled={isPending}>
              Annuleren
            </Button>
          </Link>
        )}
        {onCancel && !backHref && (
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Annuleren
          </Button>
        )}
      </div>
    </form>
  );
}
