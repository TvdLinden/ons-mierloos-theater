import { insertShow, linkShowToTags } from '@/lib/commands/shows';
import { redirect } from 'next/navigation';
import { uploadFile } from '@/lib/commands/files';
import { readFormFile, createThumbnail } from '@/lib/utils/image';
import { Card } from '@/components/ui';
import { requireRole } from '@/lib/utils/auth';
import { ShowStatus } from '@/lib/db';
import AddShowForm from '@/components/AddShowForm';

type ShowFormData = {
  title: string;
  subtitle?: string;
  slug: string;
  description: string;
  basePrice: string;
  status?: string;
  image?: File;
  tagIds?: string[];
};

function parseShowFormData(form: FormData): ShowFormData {
  const tagIds = form.getAll('tagIds') as string[];

  return {
    title: form.get('title') as string,
    subtitle: (form.get('subtitle') as string) || undefined,
    slug: (form.get('slug') as string) || undefined,
    description: form.get('description') as string,
    basePrice: form.get('basePrice') as string,
    status: (form.get('status') as string) || 'draft',
    image: form.get('image') as File,
    tagIds: tagIds.length > 0 ? tagIds : undefined,
  };
}

export default async function AddShowPage() {
  await requireRole(['admin', 'contributor']);

  async function handleAddShow(prevState: { error?: string }, formData: FormData) {
    'use server';

    const form = parseShowFormData(formData);
    if (!form.title || !form.description) {
      return { error: 'Titel en beschrijving zijn verplicht.' };
    }
    if (
      !form.basePrice ||
      isNaN(Number(form.basePrice)) ||
      !/^\d+(\.\d{1,2})?$/.test(form.basePrice)
    ) {
      return {
        error: 'Basisprijs is verplicht en moet een geldig decimaal getal zijn (max 2 decimalen).',
      };
    }

    let fileId: string | null = null;
    let thumbnailFileId: string | null = null;

    if (form.image && form.image.size > 0) {
      // validate image file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const fileType = form.image.type || '';

      if (!allowedTypes.includes(fileType)) {
        return { error: 'Alleen JPEG en PNG afbeeldingen zijn toegestaan.' };
      }

      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (form.image.size > maxSizeInBytes) {
        return { error: 'De afbeelding mag niet groter zijn dan 5MB.' };
      }

      try {
        // Read file buffer
        const imageBuffer = await readFormFile(form.image);

        // Upload original image
        fileId = await uploadFile(imageBuffer, form.image.name, fileType);

        // Create and upload thumbnail (200x200)
        const thumbnailBuffer = await createThumbnail(imageBuffer, 200, 200);

        thumbnailFileId = await uploadFile(thumbnailBuffer, `thumb_${form.image.name}`, fileType);
      } catch (error) {
        console.error('Error uploading image:', error);
        return { error: 'Fout bij het uploaden van de afbeelding.' };
      }
    }

    try {
      const show = await insertShow({
        title: form.title,
        subtitle: form.subtitle,
        slug: form.slug,
        description: form.description,
        basePrice: form.basePrice,
        status: (form.status as ShowStatus) || 'draft',
        imageId: fileId || undefined,
        publicationDate: null,
        depublicationDate: null,
        thumbnailImageId: thumbnailFileId || undefined,
      });

      // Link tags if provided
      if (form.tagIds && form.tagIds.length > 0) {
        await linkShowToTags(show.id, form.tagIds);
      }

      redirect(`/admin/shows/${show.id}/performances`);
    } catch (error) {
      console.error('Error inserting show:', error);
      return { error: 'Opslaan mislukt.' };
    }
  }

  return (
    <Card className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8 text-primary">Nieuwe voorstelling toevoegen</h1>
      <AddShowForm action={handleAddShow} availableTags={[]} />
    </Card>
  );
}
