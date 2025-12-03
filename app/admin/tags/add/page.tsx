import { requireRole } from '@/lib/utils/auth';
import TagForm from '@/components/TagForm';
import { createTag } from '@/lib/actions/tags';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function AddTagPage() {
  await requireRole(['admin', 'contributor']);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <AdminPageHeader title="Nieuwe Tag Toevoegen" />
      <div className="bg-surface rounded-lg shadow p-8">
        <TagForm action={createTag} />
      </div>
    </div>
  );
}
