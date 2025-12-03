'use client';

import { useActionState } from 'react';
import { Card, Button, SimpleFormField, Input, Alert } from '@/components/ui';
import DateTimeInput from '@/components/DateTimeInput';
import StatusSelector from '@/components/StatusSelector';
import Textarea from '@/components/Textarea';
import Link from 'next/link';
import { updatePerformanceAction } from './actions';
import type { PerformanceWithShow } from '@/lib/db';

export default function EditPerformanceForm({ performance }: { performance: PerformanceWithShow }) {
  const [state, formAction, isPending] = useActionState(updatePerformanceAction, {
    error: undefined,
    performanceId: performance.id,
    showId: performance.show?.id,
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link
          href={`/admin/shows/${performance.show?.id}/performances`}
          className="text-primary hover:underline"
        >
          ← Terug naar {performance.show?.title}
        </Link>
      </div>

      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2 text-primary">Speeltijd bewerken</h1>
        <p className="text-gray-600 mb-6">{performance.show?.title}</p>

        <form action={formAction} className="space-y-6">
          {state.error && <Alert variant="destructive">{state.error}</Alert>}
          <input type="hidden" name="performanceId" value={performance.id} />
          <input type="hidden" name="showId" value={performance.show?.id} />

          <SimpleFormField label="Datum en tijd" required>
            <DateTimeInput
              name="date"
              defaultValue={
                performance.date ? new Date(performance.date).toISOString().slice(0, 16) : ''
              }
              required
            />
          </SimpleFormField>

          <SimpleFormField
            label="Prijs"
            helperText={`Laat leeg om de basisprijs (€${performance.show?.basePrice}) te gebruiken`}
          >
            <Input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={performance.price || ''}
              placeholder={performance.show?.basePrice || ''}
            />
          </SimpleFormField>

          <SimpleFormField label="Totaal aantal plaatsen">
            <Input
              name="totalSeats"
              type="number"
              min="1"
              defaultValue={performance.totalSeats || 100}
            />
          </SimpleFormField>

          <SimpleFormField label="Beschikbare plaatsen">
            <Input
              name="availableSeats"
              type="number"
              min="0"
              defaultValue={performance.availableSeats || 100}
            />
          </SimpleFormField>

          <SimpleFormField
            label="Publicatiedatum"
            helperText="Wanneer wordt deze speeltijd zichtbaar?"
          >
            <DateTimeInput
              name="publicationDate"
              defaultValue={
                performance.show?.publicationDate
                  ? new Date(performance.show.publicationDate).toISOString().slice(0, 16)
                  : ''
              }
            />
          </SimpleFormField>

          <SimpleFormField
            label="Depublicatiedatum"
            helperText="Wanneer wordt deze speeltijd verborgen?"
          >
            <DateTimeInput
              name="depublicationDate"
              defaultValue={
                performance.show?.depublicationDate
                  ? new Date(performance.show.depublicationDate).toISOString().slice(0, 16)
                  : ''
              }
            />
          </SimpleFormField>

          <SimpleFormField label="Notities" helperText="Interne aantekeningen">
            <Textarea
              name="notes"
              defaultValue={performance.notes || ''}
              placeholder="Bijv. Extra matinee, Special pricing"
              rows={3}
            />
          </SimpleFormField>

          <SimpleFormField label="Status" required>
            <StatusSelector
              name="status"
              defaultValue={performance.status || 'draft'}
              options={[
                { value: 'draft', label: 'Concept' },
                { value: 'published', label: 'Gepubliceerd' },
                { value: 'sold_out', label: 'Uitverkocht' },
                { value: 'cancelled', label: 'Geannuleerd' },
                { value: 'archived', label: 'Gearchiveerd' },
              ]}
            />
          </SimpleFormField>

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Opslaan...' : 'Opslaan'}
            </Button>
            <Link href={`/admin/shows/${performance.show?.id}/performances`}>
              <Button type="button" variant="secondary">
                Annuleren
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
