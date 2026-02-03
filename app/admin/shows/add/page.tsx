import { handleUpsertShow } from '../actions';
import { Card } from '@/components/ui';
import { requireRole } from '@/lib/utils/auth';
import { getAllTags } from '@/lib/queries/tags';
import { getAllImages } from '@/lib/queries/images';
import ShowForm from '@/components/ShowForm';

export default async function AddShowPage() {
  await requireRole(['admin', 'contributor']);
  const [availableTags, availableImages] = await Promise.all([getAllTags(), getAllImages(0, 1000)]);

  // Create a bound action for creating a new show (showId = null)
  const boundAction = handleUpsertShow.bind(null, null, []);

  return (
    <Card className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8 text-primary">Nieuwe voorstelling toevoegen</h1>
      <ShowForm
        action={boundAction}
        availableTags={availableTags}
        availableImages={availableImages}
      />
    </Card>
  );
}
