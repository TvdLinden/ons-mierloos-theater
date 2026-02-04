import { handleUpsertShow } from '../actions';
import { Card } from '@/components/ui';
import { requireRole } from '@/lib/utils/auth';
import { getAllTags } from '@/lib/queries/tags';
import { getAllImages } from '@/lib/queries/images';
import ShowForm from '@/components/ShowForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function AddShowPage() {
  await requireRole(['admin', 'contributor']);
  const [availableTags, availableImages] = await Promise.all([getAllTags(), getAllImages(0, 1000)]);

  // Create a bound action for creating a new show (showId = null)
  const boundAction = handleUpsertShow.bind(null, null, []);

  return (
    <>
      <AdminPageHeader
        title="Nieuwe voorstelling toevoegen"
        breadcrumbs={[
          { label: 'Voorstellingen', href: '/admin/shows' },
          { label: 'Toevoegen' },
        ]}
      />
      <Card className="p-6">
        <ShowForm
          action={boundAction}
          availableTags={availableTags}
          availableImages={availableImages}
        />
      </Card>
    </>
  );
}
