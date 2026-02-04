'use server';

import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ShowsTableClient } from './ShowsTableClient';
import { updateShow } from '@ons-mierloos-theater/shared/commands/shows';
import { revalidatePath } from 'next/cache';
import { invalidatePerformancePaths } from '@/lib/utils/invalidatePerformancePaths';
import { db } from '@ons-mierloos-theater/shared/db';
import { shows } from '@ons-mierloos-theater/shared/db/schema';
import { eq } from 'drizzle-orm';
import type { Show } from '@ons-mierloos-theater/shared/db';

export default async function AdminPerformanceOverview() {
  async function handleStatusChange(id: string, targetStatus: 'published' | 'draft') {
    'use server';

    // Get the show to check current state
    const show = await db.query.shows.findFirst({
      where: eq(shows.id, id),
    });

    const updateFields: Partial<Show> = { status: targetStatus };

    // if publicationDate is not set and targetStatus is Published, set publicationDate to now
    if (targetStatus === 'published' && !show?.publicationDate) {
      updateFields.publicationDate = new Date();
    }

    // if depublicationDate is set and targetStatus is Draft, clear depublicationDate
    if (targetStatus === 'draft' && show?.depublicationDate) {
      updateFields.depublicationDate = null;
    }

    await updateShow(id, updateFields);
    revalidatePath('/admin/shows');
    invalidatePerformancePaths(id);
  }

  return (
    <>
      <AdminPageHeader
        title="Voorstellingen Beheer"
        breadcrumbs={[{ label: 'Voorstellingen' }]}
        action={{
          href: '/admin/shows/add',
          label: 'Nieuwe voorstelling toevoegen',
        }}
      />
      <ShowsTableClient onStatusChange={handleStatusChange} />
    </>
  );
}
