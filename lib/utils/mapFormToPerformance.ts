import { ShowFormState } from '@/components/ShowForm';
import { Show } from '@/lib/db';

export function mapFormToPerformance(
  form: ShowFormState,
): Omit<Show, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: form.title,
    subtitle: form.subtitle ?? null,
    slug: form.slug,
    description: form.description,
    imageId: form.imageId ?? null,
    basePrice: form.price,
    status: form.status as 'draft' | 'published' | 'archived',
    publicationDate: form.publicationDate ? new Date(form.publicationDate) : null,
    depublicationDate: form.depublicationDate ? new Date(form.depublicationDate) : null,
  };
}
