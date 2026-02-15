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

type EditPerformanceFormProps = {
  action: (prevState: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
  performance: Performance;
  backHref: string;
};

export default function EditPerformanceForm({
  action,
  performance,
  backHref,
}: EditPerformanceFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  // Convert date to datetime-local format
  const dateValue = new Date(performance.date);

  return (
    <form action={formAction} className="space-y-6">
      <FormField label="Datum en tijd" required>
        <DateTimePicker name="date" defaultValue={dateValue} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Prijs (€)" helperText="Standaard indien leeg">
          <NumberInput
            name="price"
            step={0.01}
            min={0}
            defaultValue={parseFloat(performance.price || '0')}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Status" required>
          <StatusSelector
            name="status"
            defaultValue={performance.status}
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
            defaultValue={performance.rows || 5}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Stoelen per rij" required>
          <NumberInput
            name="seatsPerRow"
            min={1}
            defaultValue={performance.seatsPerRow || 20}
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
          defaultValue={performance.notes || ''}
          rows={2}
        />
      </FormField>

      {state.error && <FormError error={state.error} />}

      <div className="flex gap-3 pt-4 border-t">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Opslaan...' : 'Opslaan'}
        </Button>
        <Link href={backHref}>
          <Button type="button" variant="outline" disabled={isPending}>
            Annuleren
          </Button>
        </Link>
      </div>
    </form>
  );
}
