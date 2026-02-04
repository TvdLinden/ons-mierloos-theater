'use server';
import Link from 'next/link';
import { getAllPages } from '@ons-mierloos-theater/shared/queries/pages';
import { updatePage } from '@ons-mierloos-theater/shared/commands/pages';
import { requireRole } from '@/lib/utils/auth';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Column, DataTable, EmptyRow, Row } from '@/components/admin/DataTable';
import { Button } from '@/components/ui';
import { Page } from '@ons-mierloos-theater/shared/db';

// Server action that accepts FormData so it can be passed safely to the form
export async function togglePageStatus(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  const target = formData.get('target') as string;
  if (!id || !target) return;
  await updatePage(id, {
    status: target as Page['status'],
    updatedAt: new Date(),
  });
}

export default async function AdminPageOverview() {
  await requireRole(['admin', 'contributor']);
  const pages = await getAllPages();

  return (
    <>
      <AdminPageHeader
        title="Pagina's Beheer"
        breadcrumbs={[{ label: "Pagina's" }]}
        action={{ href: '/admin/pages/add', label: 'Nieuwe pagina toevoegen' }}
      />

      {pages.length === 0 ? (
        <div className="text-center text-zinc-500 py-8">Er zijn geen pagina&apos;s gevonden.</div>
      ) : (
        <DataTable headers={['Titel', 'Slug', 'Status', 'Aangemaakt', 'Acties']}>
          {pages.map((page) => {
            const isPublished = page.status === 'published';
            const actionLabel = isPublished ? 'Maak concept' : 'Publiceer';
            const targetStatus = isPublished ? 'draft' : 'published';
            const createdAt = page.createdAt
              ? new Date(page.createdAt).toLocaleDateString('nl-NL')
              : '-';
            return (
              <tr key={page.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-primary">{page.title}</div>
                </td>
                <td className="px-6 py-4 text-zinc-600 text-sm">{page.slug}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                  >
                    {isPublished ? 'Gepubliceerd' : 'Concept'}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-600 text-sm">{createdAt}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link href={`/admin/pages/edit/${page.id}`}>
                      <Button type="button" variant="default">
                        Bewerk
                      </Button>
                    </Link>
                    <Link href={`/admin/pages/preview/${page.id}`} target="_blank" rel="noreferrer">
                      <Button type="button" variant="ghost">
                        Bekijk
                      </Button>
                    </Link>
                    <form action={togglePageStatus} method="post">
                      <input type="hidden" name="id" value={page.id} />
                      <input type="hidden" name="target" value={targetStatus} />
                      <Button type="submit" variant="secondary">
                        {actionLabel}
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </>
  );
}
