'use client';

import { useActionState } from 'react';
import { Button, SimpleFormField as FormField } from '@/components/ui';
import FormError from './FormError';
import StatusSelector from './StatusSelector';
import DateTimeInput from './DateTimeInput';
import Textarea from './Textarea';
import { NumberInput } from './ui/number-input';

type PerformanceFormProps = {
  action: (prevState: { error?: string }, formData: FormData) => Promise<{ error?: string }>;
  showBasePrice: string;
};

export default function AddPerformanceToShowForm({ action, showBasePrice }: PerformanceFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-6">
      <FormField label="Datum en tijd" required>
        <DateTimeInput name="date" required />
      </FormField>

      <FormField
        label="Prijs"
        helperText={`Laat leeg om de basisprijs (€${showBasePrice}) te gebruiken`}
      >
        <NumberInput
          name="price"
          step={0.01}
          min={0}
          placeholder={showBasePrice}
          disabled={isPending}
        />
      </FormField>

      <FormField label="Aantal rijen" helperText="Hoeveel rijen in de zaal?" required>
        <NumberInput name="rows" min={1} max={26} defaultValue={5} disabled={isPending} />
      </FormField>

      <FormField label="Stoelen per rij" helperText="Hoeveel stoelen per rij?" required>
        <NumberInput name="seatsPerRow" min={1} defaultValue={20} disabled={isPending} />
      </FormField>

      <FormField label="Publicatiedatum" helperText="Wanneer wordt deze speeltijd zichtbaar?">
        <DateTimeInput name="publicationDate" />
      </FormField>

      <FormField label="Depublicatiedatum" helperText="Wanneer wordt deze speeltijd verborgen?">
        <DateTimeInput name="depublicationDate" />
      </FormField>

      <FormField
        label="Notities"
        helperText="Interne aantekeningen (niet zichtbaar voor bezoekers)"
      >
        <Textarea name="notes" placeholder="Bijv. Extra matinee, Special pricing" rows={3} />
      </FormField>

      <FormField label="Status" required>
        <StatusSelector
          name="status"
          defaultValue="draft"
          options={[
            { value: 'draft', label: 'Concept' },
            { value: 'published', label: 'Gepubliceerd' },
            { value: 'sold_out', label: 'Uitverkocht' },
            { value: 'cancelled', label: 'Geannuleerd' },
            { value: 'archived', label: 'Gearchiveerd' },
          ]}
        />
      </FormField>

      {state.error && <FormError error={state.error} />}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Toevoegen...' : 'Speeltijd toevoegen'}
      </Button>
    </form>
  );
}
