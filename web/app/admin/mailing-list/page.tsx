import { requireRole } from '@/lib/utils/auth';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import {
  getAllActiveSubscribers,
  getActiveSubscribersCount,
} from '@ons-mierloos-theater/shared/queries/mailingList';
import { sendMailingListEmail } from '@ons-mierloos-theater/shared/utils/email';
import { revalidatePath } from 'next/cache';
import MailingListForm from '@/components/MailingListForm';
import { ExportDropdown } from '@/components/admin/ExportDropdown';
import type { ExportData } from '@ons-mierloos-theater/shared/utils/export';

export default async function MailingListPage() {
  await requireRole(['admin']);

  const subscriberCount = await getActiveSubscribersCount();

  async function getMailingListExportData(): Promise<ExportData> {
    'use server';
    const subscribers = await getAllActiveSubscribers();
    const headers = ['E-mailadres', 'Naam', 'Ingeschreven op'];
    const rows = subscribers.map((s) => [
      s.email,
      s.name ?? '',
      s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString('nl-NL') : '',
    ]);
    return { headers, rows };
  }

  async function handleSendEmail(
    prevState: { error?: string; success?: boolean },
    formData: FormData,
  ) {
    'use server';

    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    if (!subject || !message) {
      return { error: 'Onderwerp en bericht zijn verplicht' };
    }

    try {
      const result = await sendMailingListEmail(subject, message);

      if (!result.success) {
        return { error: result.error || 'Fout bij versturen van e-mails' };
      }

      revalidatePath('/admin/mailing-list');
      return { success: true };
    } catch (error) {
      console.error('Error sending mailing list email:', error);
      return { error: 'Er is een fout opgetreden bij het versturen' };
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Nieuwsbrief Versturen"
        breadcrumbs={[{ label: 'Nieuwsbrief' }]}
        action={
          <ExportDropdown
            getExportData={getMailingListExportData}
            filename="nieuwsbrief-abonnees"
          />
        }
      />

      <div className="mb-8">
        <StatCard label="Actieve Abonnees" value={subscriberCount} valueColor="text-primary" />
      </div>

      <div className="bg-surface rounded-lg shadow p-8">
        <MailingListForm action={handleSendEmail} subscriberCount={subscriberCount} />
      </div>
    </>
  );
}
