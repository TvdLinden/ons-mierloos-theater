import ShowForm from '@/components/ShowForm';
import { insertShow } from '@/lib/commands/shows';
import { insertPerformance } from '@/lib/commands/shows';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/utils/auth';
import { getAllTags } from '@/lib/queries/tags';
import { setShowTags } from '@/lib/commands/tags';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { validateImageFile } from '@/lib/utils/performanceFormHelpers';
import { handleImageUpload } from '@/lib/utils/imageUpload';
import { isValidSlug } from '@/lib/utils/slug';
import type { PerformanceStatus } from '@/lib/db';

type NewPerformance = {
  date: string;
  price: string;
  totalSeats: number;
  availableSeats: number;
  status: PerformanceStatus;
  notes?: string;
};

export default async function AddPerformancePage() {
  await requireRole(['admin', 'contributor']);
  const availableTags = await getAllTags();

  async function handleAddPerformance(prevState: { error?: string }, formData: FormData) {
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

    let imageId: string | undefined;
    let thumbnailId: string | undefined;

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
      // Insert the show first
      const show = await insertShow({
        title,
        subtitle: subtitle || null,
        description,
        slug,
        basePrice,
        imageId: imageId || null,
        thumbnailImageId: thumbnailId || null,
        status: 'draft',
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        depublicationDate: depublicationDate ? new Date(depublicationDate) : null,
      });

      if (!show?.id) {
        return { error: 'Het aanmaken van de show is mislukt.' };
      }

      // Assign tags to the show
      if (tagIds.length > 0) {
        await setShowTags(show.id, tagIds);
      }

      // Insert all performances for this show
      if (performances.length > 0) {
        for (const perf of performances) {
          await insertPerformance({
            showId: show.id,
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
      console.error('Error creating show:', error);
      return { error: 'Opslaan mislukt.' };
    }

    redirect('/admin/performances');
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <AdminPageHeader title="Nieuwe Voorstelling Toevoegen" />
      <div className="bg-surface rounded-lg shadow p-8">
        <ShowForm action={handleAddPerformance} availableTags={availableTags} />
      </div>
    </div>
  );
}
