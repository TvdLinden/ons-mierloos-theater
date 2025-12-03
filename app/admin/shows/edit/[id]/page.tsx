import ShowForm, { ShowFormState } from '@/components/ShowForm';
import { updateShow } from '@/lib/commands/shows';
import { insertPerformance } from '@/lib/commands/shows';
import { redirect, notFound } from 'next/navigation';
import { requireRole } from '@/lib/utils/auth';
import { getAllTags } from '@/lib/queries/tags';
import { setShowTags } from '@/lib/commands/tags';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { validateImageFile } from '@/lib/utils/performanceFormHelpers';
import { handleImageUpload } from '@/lib/utils/imageUpload';
import { isValidSlug } from '@/lib/utils/slug';
import { getShowByIdWithTagsAndPerformances } from '@/lib/queries/shows';
import type { PerformanceStatus } from '@/lib/db';

type NewPerformance = {
  date: string;
  price: string;
  totalSeats: number;
  availableSeats: number;
  status: PerformanceStatus;
  notes?: string;
};

export default async function EditShowPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  await requireRole(['admin', 'contributor']);

  const show = await getShowByIdWithTagsAndPerformances(id);
  if (!show) return notFound();

  const availableTags = await getAllTags();

  async function handleUpdateShow(prevState: { error?: string }, formData: FormData) {
    'use server';

    // Parse basic show fields
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const description = formData.get('description') as string;
    const slug = formData.get('slug') as string;
    const basePrice = formData.get('price') as string;
    const publicationDate = formData.get('publicationDate') as string;
    const depublicationDate = formData.get('depublicationDate') as string;
    const image = formData.get('image') as File;
    const tagIds = formData.getAll('tagIds') as string[];

    // Parse performances array from hidden inputs
    const performancesData = formData.getAll('performances') as string[];
    const performances: NewPerformance[] = performancesData.map((p) => JSON.parse(p));

    // Validate basic fields
    if (!title || !description) {
      return { error: 'Titel en beschrijving zijn verplicht.' };
    }

    if (!isValidSlug(slug)) {
      return {
        error: 'Slug is verplicht en mag alleen kleine letters, cijfers en streepjes bevatten.',
      };
    }

    if (!basePrice || isNaN(Number(basePrice)) || !/^\d+(\.\d{1,2})?$/.test(basePrice)) {
      return {
        error: 'Prijs is verplicht en moet een geldig decimaal getal zijn (max 2 decimalen).',
      };
    }

    let imageId: string | undefined = show.imageId || undefined;
    let thumbnailId: string | undefined = show.thumbnailImageId || undefined;

    // Handle image upload if provided
    if (image && image.size > 0) {
      const imageValidation = validateImageFile(image);
      if (!imageValidation.valid) {
        return { error: imageValidation.error };
      }

      const uploadResult = await handleImageUpload(image);
      if (!uploadResult.success) {
        return { error: uploadResult.error };
      }

      imageId = uploadResult.imageId;
      thumbnailId = uploadResult.thumbnailId;
    }

    try {
      // Update the show
      await updateShow(id, {
        title,
        subtitle: subtitle || null,
        description,
        slug,
        basePrice,
        imageId: imageId || null,
        thumbnailImageId: thumbnailId || null,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        depublicationDate: depublicationDate ? new Date(depublicationDate) : null,
      });

      // Update tags
      await setShowTags(id, tagIds);

      // Handle performances - for now, we'll keep it simple and just insert new ones
      // In a full implementation, you'd want to track which ones are new/edited/deleted
      if (performances.length > 0) {
        for (const perf of performances) {
          await insertPerformance({
            showId: id,
            date: new Date(perf.date),
            price: perf.price,
            totalSeats: perf.totalSeats,
            availableSeats: perf.availableSeats,
            status: perf.status,
            notes: perf.notes || null,
          });
        }
      }
    } catch (error) {
      console.error('Error updating show:', error);
      return { error: 'Opslaan mislukt.' };
    }

    redirect('/admin/performances');
  }

  // Map show data to form state
  const initialData: ShowFormState = {
    title: show.title,
    subtitle: show.subtitle || undefined,
    date:
      show.performances && show.performances.length > 0
        ? new Date(show.performances[0].date).toISOString().slice(0, 16)
        : '',
    description: show.description,
    slug: show.slug,
    imageId: show.imageId || undefined,
    thumbnailImageId: show.thumbnailImageId || undefined,
    price: show.basePrice,
    status: show.status,
    publicationDate: show.publicationDate
      ? new Date(show.publicationDate).toISOString().slice(0, 16)
      : undefined,
    depublicationDate: show.depublicationDate
      ? new Date(show.depublicationDate).toISOString().slice(0, 16)
      : undefined,
    performances: show.performances || [],
    tagIds: show.tags?.map((t) => t.id) || undefined,
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <AdminPageHeader title="Voorstelling Bewerken" />
      <div className="bg-surface rounded-lg shadow p-8">
        <ShowForm action={handleUpdateShow} initial={initialData} availableTags={availableTags} />
      </div>
    </div>
  );
}
