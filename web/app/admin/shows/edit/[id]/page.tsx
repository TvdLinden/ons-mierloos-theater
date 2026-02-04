import ShowForm, { ShowFormState } from '@/components/ShowForm';
import { notFound } from 'next/navigation';
import { getAllTags } from '@ons-mierloos-theater/shared/queries/tags';
import { getAllImages } from '@ons-mierloos-theater/shared/queries/images';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { getShowByIdWithTagsAndPerformances } from '@ons-mierloos-theater/shared/queries/shows';
import { handleUpsertShow } from '../../actions';
import Link from 'next/link';
import { Button } from '@/components/ui';

export default async function EditShowPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const show = await getShowByIdWithTagsAndPerformances(id);
  if (!show) return notFound();

  const [availableTags, availableImages] = await Promise.all([getAllTags(), getAllImages(0, 1000)]);

  const boundAction = handleUpsertShow.bind(null, id, show.performances || []);

  const initialData: ShowFormState = {
    title: show.title,
    subtitle: show.subtitle || undefined,
    blocks: show.blocks,
    slug: show.slug,
    imageId: show.imageId || undefined,
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
    <>
      <AdminPageHeader
        title="Voorstelling bewerken"
        subtitle={show.title}
        breadcrumbs={[
          { label: 'Voorstellingen', href: '/admin/shows' },
          { label: show.title, href: `/admin/shows/${id}` },
          { label: 'Bewerken' },
        ]}
        action={
          <div className="flex gap-2">
            <Link href={`/admin/shows/${id}/performances`}>
              <Button variant="secondary">Speeltijden</Button>
            </Link>
          </div>
        }
      />
      <ShowForm
        action={boundAction}
        initial={initialData}
        availableTags={availableTags}
        availableImages={availableImages}
        cancelHref={`/admin/shows/${id}`}
      />
    </>
  );
}
