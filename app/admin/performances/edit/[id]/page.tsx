import ShowForm, { ShowFormState } from '@/components/ShowForm';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/utils/auth';
import { getAllTags } from '@/lib/queries/tags';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getShowByIdWithTagsAndPerformances } from '@/lib/queries/shows';
import { handleUpsertShow } from '../../../shows/actions';

export default async function EditPerformancePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  await requireRole(['admin', 'contributor']);

  // Fetch the show by its ID
  const show = await getShowByIdWithTagsAndPerformances(id);
  if (!show) return notFound();

  const availableTags = await getAllTags();

  // Create a bound action with the show's ID and current performances
  const boundAction = handleUpsertShow.bind(null, id, show.performances || []);

  // Map show data to form state
  const initialData: ShowFormState = {
    title: show.title,
    subtitle: show.subtitle || undefined,
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
        <ShowForm action={boundAction} initial={initialData} availableTags={availableTags} />
      </div>
    </div>
  );
}
