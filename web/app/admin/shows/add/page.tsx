import { handleUpsertShow } from '../actions';
import { getAllTags } from '@ons-mierloos-theater/shared/queries/tags';
import ShowForm from '@/components/ShowForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function AddShowPage() {
  const availableTags = await getAllTags();

  const boundAction = handleUpsertShow.bind(null, null);

  return (
    <>
      <AdminPageHeader
        title="Nieuwe voorstelling toevoegen"
        breadcrumbs={[{ label: 'Voorstellingen', href: '/admin/shows' }, { label: 'Toevoegen' }]}
      />
      <ShowForm action={boundAction} availableTags={availableTags} cancelHref="/admin/shows" />
    </>
  );
}
