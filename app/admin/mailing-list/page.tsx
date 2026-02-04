import { requireRole } from '@/lib/utils/auth';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { getActiveSubscribersCount } from '@/lib/queries/mailingList';
import { sendMailingListEmail } from '@/lib/utils/email';
import { revalidatePath } from 'next/cache';
import MailingListForm from '@/components/MailingListForm';

export default async function MailingListPage() {
  await requireRole(['admin']);

  const subscriberCount = await getActiveSubscribersCount();

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
