import { requireRole } from '@/lib/utils/auth';
import TagForm from '@/components/TagForm';
import { createTag } from '@/lib/actions/tags';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function AddTagPage() {
  await requireRole(['admin', 'contributor']);

  return (
    <>
      <AdminPageHeader
        title="Nieuwe Tag Toevoegen"
        breadcrumbs={[
          { label: 'Tags', href: '/admin/tags' },
          { label: 'Toevoegen' },
        ]}
      />
      <div className="bg-surface rounded-lg shadow p-8">
        <TagForm action={createTag} />
      </div>
    </>
  );
}
