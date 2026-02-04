import { getTagById } from '@/lib/queries/tags';
import { requireRole } from '@/lib/utils/auth';
import { notFound } from 'next/navigation';
import TagForm from '@/components/TagForm';
import { editTag } from '@/lib/actions/tags';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

export default async function EditTagPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  await requireRole(['admin', 'contributor']);
  const tag = await getTagById(params.id);

  if (!tag) return notFound();

  return (
    <>
      <AdminPageHeader
        title="Tag Bewerken"
        breadcrumbs={[
          { label: 'Tags', href: '/admin/tags' },
          { label: tag.name },
        ]}
      />
      <div className="bg-surface rounded-lg shadow p-8">
        <TagForm action={editTag.bind(null, params.id)} initialData={tag} />
      </div>
    </>
  );
}
