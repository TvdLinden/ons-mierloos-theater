'use client';

import { useActionState } from 'react';
import { Button, SimpleFormField as FormField, Input } from '@/components/ui';
import FormError from './FormError';
import StatusSelector from './StatusSelector';
import DateTimeInput from './DateTimeInput';
import Textarea from './Textarea';

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
        <Input
          name="price"
          type="number"
          step="0.01"
          min="0"
          placeholder={showBasePrice}
          disabled={isPending}
        />
      </FormField>

      <FormField label="Aantal plaatsen" helperText="Totaal aantal beschikbare plaatsen">
        <Input name="totalSeats" type="number" min="1" defaultValue="100" disabled={isPending} />
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
