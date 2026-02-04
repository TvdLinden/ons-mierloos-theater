'use server';
import Link from 'next/link';
import { getAllTags } from '@/lib/queries/tags';
import { deleteTag } from '@/lib/commands/tags';
import { requireRole } from '@/lib/utils/auth';
import { revalidatePath } from 'next/cache';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';

export default async function AdminTagsPage() {
  await requireRole(['admin', 'contributor']);
  const tags = await getAllTags();

  async function handleDelete(tagId: string) {
    'use server';
    await deleteTag(tagId);
    revalidatePath('/admin/tags');
  }

  return (
    <>
      <AdminPageHeader
        title="Tags Beheer"
        breadcrumbs={[{ label: 'Tags' }]}
        action={{
          href: '/admin/tags/add',
          label: 'Nieuwe tag toevoegen',
        }}
      />
      <DataTable headers={['Naam', 'Slug', 'Beschrijving', 'Acties']}>
        {tags.length === 0 ? (
          <EmptyRow colSpan={4} message="Er zijn geen tags gevonden" />
        ) : (
          tags.map((tag) => (
            <tr key={tag.id} className="hover:bg-zinc-50">
              <td className="px-6 py-4 font-semibold text-primary">{tag.name}</td>
              <td className="px-6 py-4 text-sm text-zinc-600">{tag.slug}</td>
              <td className="px-6 py-4 text-sm text-zinc-600">{tag.description || '-'}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Link
                    href={`/admin/tags/edit/${tag.id}`}
                    className="px-3 py-1 bg-primary text-surface rounded hover:bg-secondary text-sm font-semibold"
                  >
                    Bewerken
                  </Link>
                  <form action={handleDelete.bind(null, tag.id)}>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-red-600 text-surface rounded hover:bg-red-700 text-sm font-semibold"
                    >
                      Verwijderen
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </>
  );
}
