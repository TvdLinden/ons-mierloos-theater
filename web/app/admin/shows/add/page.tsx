import { handleUpsertShow } from '../actions';
import { getAllTags } from '@ons-mierloos-theater/shared/queries/tags';
import { getAllImages } from '@ons-mierloos-theater/shared/queries/images';
import ShowForm from '@/components/ShowForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function AddShowPage() {
  const [availableTags, availableImages] = await Promise.all([getAllTags(), getAllImages(0, 1000)]);

  const boundAction = handleUpsertShow.bind(null, null, []);

  return (
    <>
      <AdminPageHeader
        title="Nieuwe voorstelling toevoegen"
        breadcrumbs={[{ label: 'Voorstellingen', href: '/admin/shows' }, { label: 'Toevoegen' }]}
      />
      <ShowForm
        action={boundAction}
        availableTags={availableTags}
        availableImages={availableImages}
        cancelHref="/admin/shows"
      />
    </>
  );
}
