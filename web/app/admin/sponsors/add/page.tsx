import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSponsor } from '@ons-mierloos-theater/shared/commands/sponsors';
import SponsorForm from '@/components/SponsorForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

async function handleAddSponsor(
  prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  'use server';

  try {
    const name = formData.get('name') as string;
    const website = formData.get('website') as string;
    const tier = formData.get('tier') as 'gold' | 'silver' | 'bronze';
    const displayOrder = parseInt(formData.get('displayOrder') as string, 10) || 0;
    const active = formData.get('active') === 'on' ? 1 : 0;
    const logoId = (formData.get('logoId') as string) || null;

    if (!name) {
      return { error: 'Sponsor naam is verplicht' };
    }

    await createSponsor({
      name,
      logoId,
      website: website || null,
      tier,
      displayOrder,
      active,
    });

    revalidatePath('/sponsors');
  } catch (error) {
    console.error('Error creating sponsor:', error);
    return { error: 'Er is een fout opgetreden bij het toevoegen van de sponsor' };
  }

  redirect('/admin/sponsors');
}

export default function AddSponsorPage() {
  return (
    <>
      <AdminPageHeader
        title="Sponsor toevoegen"
        breadcrumbs={[{ label: 'Sponsors', href: '/admin/sponsors' }, { label: 'Toevoegen' }]}
      />
      <SponsorForm action={handleAddSponsor} submitLabel="Sponsor toevoegen" />
    </>
  );
}
