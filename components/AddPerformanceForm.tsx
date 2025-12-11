'use client';

import { useActionState } from 'react';
import { Button, Input, Textarea, SimpleFormField, Alert } from '@/components/ui';
import TagSelector from './TagSelector';
import { PerformanceStatus, Tag } from '@/lib/db';
import { generateSlug } from '@/lib/utils/slug';
import Image from 'next/image';
import { useState } from 'react';
import { DataTable, Row } from './admin/DataTable';
import StatusSelector from './StatusSelector';
import { NumberInput } from './ui/number-input';

export type PerformanceFormState = {
  title: string;
  subtitle?: string;
  date: string;
  description: string;
  slug: string;
  imageId?: string;
  thumbnailImageId?: string;
  price: string;
  status: PerformanceStatus;
  publicationDate?: string;
  depublicationDate?: string;
  performances: NewPerformance[];
  tagIds?: string[];
};

type NewPerformance = {
  date: string;
  price: string;
  totalSeats: number;
  availableSeats: number;
  status: PerformanceStatus;
  notes?: string;
};

type FormState = {
  error?: string;
};

export default function AddPerformanceForm({
  action,
  initial,
  availableTags = [],
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  initial?: PerformanceFormState;
  availableTags?: Tag[];
}) {
  const [state, formAction, isPending] = useActionState(action, { error: undefined });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [performances, setPerformances] = useState<NewPerformance[]>(
    initial?.performances && Array.isArray(initial.performances)
      ? initial.performances.map((p: NewPerformance) => ({
          date: typeof p.date === 'string' ? p.date : new Date(p.date).toISOString().slice(0, 16),
          price: p.price?.toString() || '',
          totalSeats: p.totalSeats || 100,
          availableSeats: p.availableSeats || 100,
          status: p.status || 'draft',
          notes: p.notes || '',
        }))
      : [],
  );
  const [editingPerformance, setEditingPerformance] = useState<NewPerformance | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleImageChange = (file: File | null) => {
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleGenerateSlug = () => {
    const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
    const slugInput = document.querySelector<HTMLInputElement>('input[name="slug"]');
    if (titleInput && slugInput) {
      slugInput.value = generateSlug(titleInput.value || initial?.title || '');
    }
  };

  const handleAddPerformance = () => {
    setEditingPerformance({
      date: '',
      price: initial?.price || '',
      totalSeats: 100,
      availableSeats: 100,
      status: 'draft',
      notes: '',
    });
    setEditingIndex(null);
  };

  const handleEditPerformance = (index: number) => {
    setEditingPerformance(performances[index]);
    setEditingIndex(index);
  };

  const handleDeletePerformance = (index: number) => {
    setPerformances(performances.filter((_, i) => i !== index));
  };

  const handleSavePerformance = (performance: NewPerformance) => {
    if (editingIndex !== null) {
      // Update existing
      setPerformances(performances.map((p, i) => (i === editingIndex ? performance : p)));
    } else {
      // Add new
      setPerformances([...performances, performance]);
    }
    setEditingPerformance(null);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingPerformance(null);
    setEditingIndex(null);
  };

  return (
    <>
      <form action={formAction} className="space-y-6">
        {state.error && <Alert variant="destructive">{state.error}</Alert>}
        <SimpleFormField label="Titel" htmlFor="title" required>
          <Input id="title" name="title" type="text" defaultValue={initial?.title} required />
        </SimpleFormField>
        <SimpleFormField label="Ondertitel" htmlFor="subtitle">
          <Input id="subtitle" name="subtitle" type="text" defaultValue={initial?.subtitle} />
        </SimpleFormField>
        <SimpleFormField label="Slug" htmlFor="slug" required>
          <div className="flex flex-col gap-2">
            <Input
              id="slug"
              name="slug"
              type="text"
              defaultValue={initial?.slug}
              pattern="[a-z0-9-]+"
              placeholder="bijv: eaque-nam-ab-quidem"
              required
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-600">
                Alleen lowercase letters, cijfers en streepjes.
              </p>
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="text-xs px-3 py-1.5 bg-primary text-surface rounded hover:bg-secondary transition-colors"
              >
                Genereer slug
              </button>
            </div>
          </div>
        </SimpleFormField>
        <SimpleFormField label="Datum & Tijd" htmlFor="date" required>
          <Input
            id="date"
            name="date"
            type="datetime-local"
            defaultValue={initial?.date}
            required
          />
        </SimpleFormField>
        <SimpleFormField label="Beschrijving" htmlFor="description" required>
          <Textarea
            id="description"
            name="description"
            defaultValue={initial?.description}
            required
          />
        </SimpleFormField>
        <SimpleFormField label="Prijs (€)" htmlFor="price" required>
          <NumberInput
            id="price"
            name="price"
            step={0.01}
            defaultValue={parseFloat(initial?.price)}
            required
          />
          <p className="text-xs text-zinc-600 mt-1">
            Standaard prijs voor voorstellingen (kan per voorstelling overschreven worden).
          </p>
        </SimpleFormField>

        <SimpleFormField label="Publicatiedatum" htmlFor="publicationDate">
          <Input
            id="publicationDate"
            name="publicationDate"
            type="datetime-local"
            defaultValue={initial?.publicationDate}
          />
          <p className="text-xs text-zinc-600 mt-1">
            Optioneel: wanneer deze show zichtbaar moet worden.
          </p>
        </SimpleFormField>

        <SimpleFormField label="Depublicatiedatum" htmlFor="depublicationDate">
          <Input
            id="depublicationDate"
            name="depublicationDate"
            type="datetime-local"
            defaultValue={initial?.depublicationDate}
          />
          <p className="text-xs text-zinc-600 mt-1">
            Optioneel: wanneer deze show verborgen moet worden.
          </p>
        </SimpleFormField>

        <DataTable
          title={'Voorstellingen'}
          emptyMessage="Nog geen voorstellingen toegevoegd"
          headers={['Datum & Tijd', 'Prijs', 'Beschikbaar', 'Status', 'Acties']}
          onAddClicked={handleAddPerformance}
        >
          <>
            {performances.map((performance, index) => (
              <Row key={index}>
                <td className="px-6 py-4">
                  {new Date(performance.date).toLocaleString('nl-NL', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </td>
                <td className="px-6 py-4">€{performance.price}</td>
                <td className="px-6 py-4">
                  {performance.availableSeats} / {performance.totalSeats}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      performance.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : performance.status === 'sold_out'
                          ? 'bg-orange-100 text-orange-800'
                          : performance.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {performance.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => handleEditPerformance(index)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Bewerk
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePerformance(index)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Verwijder
                  </button>
                </td>
              </Row>
            ))}
            {/* Hidden inputs to pass performances data */}
            {performances.map((perf, index) => (
              <input
                key={`perf-${index}`}
                type="hidden"
                name={`performances[${index}]`}
                value={JSON.stringify(perf)}
              />
            ))}
          </>
        </DataTable>

        <SimpleFormField label="Afbeelding" htmlFor="image">
          <Input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
          />
          {(previewUrl || initial?.imageId) && (
            <div className="mt-4 relative w-full max-w-md">
              <Image
                src={previewUrl || `/api/images/${initial?.imageId}`}
                alt="Preview"
                width={400}
                height={225}
                className="rounded-lg border border-border object-cover"
              />
            </div>
          )}
          <p className="text-xs text-zinc-600 mt-1">Maximaal 5MB, JPEG of PNG formaat</p>
        </SimpleFormField>
        {availableTags.length > 0 && (
          <SimpleFormField label="Tags" htmlFor="tags">
            <TagSelector
              availableTags={availableTags}
              selectedTagIds={initial?.tagIds}
              name="tagIds"
            />
          </SimpleFormField>
        )}
        <div className="pt-4 border-t border-zinc-200">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </form>

      {editingPerformance && (
        <PerformanceDialog
          performance={editingPerformance}
          onSave={handleSavePerformance}
          onCancel={handleCancelEdit}
          isEdit={editingIndex !== null}
        />
      )}
    </>
  );
}

type PerformanceDialogProps = {
  performance: NewPerformance;
  onSave: (performance: NewPerformance) => void;
  onCancel: () => void;
  isEdit: boolean;
};

function PerformanceDialog({ performance, onSave, onCancel, isEdit }: PerformanceDialogProps) {
  const [formData, setFormData] = useState<NewPerformance>(performance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof NewPerformance, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-primary">
          {isEdit ? 'Voorstelling Bewerken' : 'Nieuwe Voorstelling'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <SimpleFormField label="Datum & Tijd" htmlFor="perf-date" required>
            <Input
              id="perf-date"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
            />
          </SimpleFormField>

          <SimpleFormField label="Prijs (€)" htmlFor="perf-price" required>
            <NumberInput
              id="perf-price"
              step={0.01}
              value={parseFloat(formData.price)}
              onChange={(value) => handleChange('price', value)}
              required
            />
          </SimpleFormField>

          <div className="grid grid-cols-2 gap-4">
            <SimpleFormField label="Totaal aantal stoelen" htmlFor="perf-total" required>
              <NumberInput
                id="perf-total"
                min={1}
                value={formData.totalSeats}
                onChange={(value) => {
                  const total = value;
                  handleChange('totalSeats', total);
                  // Keep available seats in sync if it was equal before
                  if (formData.availableSeats === formData.totalSeats) {
                    handleChange('availableSeats', total);
                  }
                }}
                required
              />
            </SimpleFormField>

            <SimpleFormField label="Beschikbare stoelen" htmlFor="perf-available" required>
              <NumberInput
                id="perf-available"
                min={0}
                max={formData.totalSeats}
                value={formData.availableSeats}
                onChange={(value) => handleChange('availableSeats', value)}
                required
              />
            </SimpleFormField>
          </div>

          <SimpleFormField label="Status" htmlFor="perf-status" required>
            <StatusSelector
              name="perf-status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as PerformanceStatus)}
              options={[
                { value: 'draft', label: 'Concept' },
                { value: 'published', label: 'Gepubliceerd' },
                { value: 'sold_out', label: 'Uitverkocht' },
                { value: 'cancelled', label: 'Geannuleerd' },
                { value: 'archived', label: 'Gearchiveerd' },
              ]}
            />
          </SimpleFormField>

          <SimpleFormField label="Notities" htmlFor="perf-notes">
            <Textarea
              id="perf-notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
            />
          </SimpleFormField>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1">
              {isEdit ? 'Opslaan' : 'Toevoegen'}
            </Button>
            <Button type="button" onClick={onCancel} className="flex-1 bg-gray-500">
              Annuleren
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
