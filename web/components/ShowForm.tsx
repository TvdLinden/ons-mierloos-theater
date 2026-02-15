'use client';

import { useActionState } from 'react';
import { Button, Input, SimpleFormField, Alert } from '@/components/ui';
import TagSelector from './TagSelector';
import { Tag, ImageMetadata } from '@ons-mierloos-theater/shared/db';
import { ImageSelector } from './ImageSelector';
import { generateSlug } from '@ons-mierloos-theater/shared/utils/slug';
import { useState } from 'react';
import Link from 'next/link';
import { BlockEditor } from './BlockEditor';
import { BlocksArray } from '@ons-mierloos-theater/shared/schemas/blocks';
import { NumberInput } from './ui/number-input';

export type ShowFormState = {
  title: string;
  subtitle?: string;
  blocks: BlocksArray;
  slug: string;
  imageId?: string;
  price: string;
  publicationDate?: string;
  depublicationDate?: string;
  tagIds?: string[];
};

type FormState = {
  error?: string;
};

export default function ShowForm({
  action,
  initial,
  availableTags = [],
  availableImages = [],
  cancelHref = '/admin/shows',
  performancesHref,
}: {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>;
  initial?: ShowFormState;
  availableTags?: Tag[];
  availableImages?: Array<ImageMetadata>;
  cancelHref?: string;
  performancesHref?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, { error: undefined });
  const [selectedImageId, setSelectedImageId] = useState<string | null>(initial?.imageId || null);

  const handleGenerateSlug = () => {
    const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
    const slugInput = document.querySelector<HTMLInputElement>('input[name="slug"]');
    if (titleInput && slugInput) {
      slugInput.value = generateSlug(titleInput.value || initial?.title || '');
    }
  };

  return (
    <>
      <form action={formAction} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        {state.error && (
          <Alert variant="destructive" className="lg:col-span-2">
            {state.error}
          </Alert>
        )}

        {/* Left column */}
        <div className="space-y-6">
          {/* Voorstelling details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Voorstelling details</h2>
            <div className="space-y-4">
              <SimpleFormField label="Titel" htmlFor="title" required>
                <Input id="title" name="title" type="text" defaultValue={initial?.title} required />
              </SimpleFormField>
              <SimpleFormField label="Ondertitel" htmlFor="subtitle">
                <Input id="subtitle" name="subtitle" type="text" defaultValue={initial?.subtitle} />
              </SimpleFormField>
              <SimpleFormField label="Slug" htmlFor="slug" required>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    name="slug"
                    type="text"
                    defaultValue={initial?.slug}
                    pattern="[a-z0-9-]+"
                    placeholder="bijv: eaque-nam-ab-quidem"
                    required
                  />
                  <Button type="button" onClick={handleGenerateSlug} variant="outline">
                    Genereer
                  </Button>
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  URL-vriendelijke naam: alleen kleine letters, cijfers en streepjes.
                </p>
              </SimpleFormField>
              <SimpleFormField label="Prijs (€)" htmlFor="price" required>
                <NumberInput
                  id="price"
                  name="price"
                  step={0.01}
                  defaultValue={Number(initial?.price)}
                  required
                />
                <p className="text-xs text-zinc-600 mt-1">
                  Standaard prijs voor voorstellingen (kan per voorstelling overschreven worden).
                </p>
              </SimpleFormField>
            </div>
          </div>

          {/* Publicatie */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Publicatie</h2>
            <div className="space-y-4">
              <SimpleFormField label="Publicatiedatum" htmlFor="publicationDate">
                <div className="flex gap-2">
                  <Input
                    id="publicationDate"
                    name="publicationDate"
                    type="datetime-local"
                    defaultValue={initial?.publicationDate}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('publicationDate') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                  >
                    Wissen
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  Optioneel: wanneer deze show zichtbaar moet worden.
                </p>
              </SimpleFormField>
              <SimpleFormField label="Depublicatiedatum" htmlFor="depublicationDate">
                <div className="flex gap-2">
                  <Input
                    id="depublicationDate"
                    name="depublicationDate"
                    type="datetime-local"
                    defaultValue={initial?.depublicationDate}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        'depublicationDate',
                      ) as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                  >
                    Wissen
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  Optioneel: wanneer deze show verborgen moet worden.
                </p>
              </SimpleFormField>
            </div>
          </div>

          {/* Afbeelding & Tags */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Afbeelding & Tags</h2>
            <div className="space-y-4">
              <ImageSelector
                label="Afbeelding"
                selectedImageId={selectedImageId}
                availableImages={availableImages}
                onSelect={(imageId) => {
                  setSelectedImageId(imageId);
                  if (imageId) {
                    const hiddenInput =
                      document.querySelector<HTMLInputElement>('input[name="imageId"]');
                    if (hiddenInput) {
                      hiddenInput.value = imageId;
                    }
                  }
                }}
                imageSize="medium"
              />
              <input type="hidden" name="imageId" value={selectedImageId || ''} />
              {availableTags.length > 0 && (
                <SimpleFormField label="Tags" htmlFor="tags">
                  <TagSelector
                    availableTags={availableTags}
                    selectedTagIds={initial?.tagIds}
                    name="tagIds"
                  />
                </SimpleFormField>
              )}
            </div>
          </div>

          {/* Speeltijden CTA */}
          {performancesHref && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-1">Speeltijden beheren</h3>
              <p className="text-sm text-blue-700 mb-3">
                Voeg speeltijden toe, bewerk of verwijder ze op de speeltijdenpagina.
              </p>
              <Link href={performancesHref}>
                <Button type="button" variant="secondary">
                  Naar speeltijden
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right column — Inhoud (sticky) */}
        <div>
          <div className="sticky top-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Inhoud</h2>
              <BlockEditor
                name="blocks"
                initialBlocks={initial?.blocks}
                availableImages={availableImages}
              />
            </div>
          </div>
        </div>

        {/* Submit — spans both columns */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Opslaan...' : 'Opslaan'}
            </Button>
            <Link href={cancelHref}>
              <Button type="button" variant="outline" disabled={isPending}>
                Annuleren
              </Button>
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}
