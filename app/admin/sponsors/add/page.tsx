import { redirect } from 'next/navigation';
import { createSponsor } from '@/lib/commands/sponsors';
import SponsorForm from '@/components/SponsorForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { handleImageUpload } from '@/lib/utils/imageUpload';

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
    const logoFile = formData.get('logoFile') as File | null;
    const existingLogoId = formData.get('existingLogoId') as string | null;

    if (!name) {
      return { error: 'Sponsor naam is verplicht' };
    }

    let logoId = existingLogoId;

    // If a new file was uploaded, handle it
    if (logoFile && logoFile.size > 0) {
      const uploadResult = await handleImageUpload(logoFile);
      if (!uploadResult.success) {
        return { error: uploadResult.error || 'Fout bij het uploaden van het logo' };
      }
      logoId = uploadResult.imageId || null;
    }

    await createSponsor({
      name,
      logoId: logoId || null,
      website: website || null,
      tier,
      displayOrder,
      active,
    });
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
        breadcrumbs={[
          { label: 'Sponsors', href: '/admin/sponsors' },
          { label: 'Toevoegen' },
        ]}
      />
      <div className="bg-surface rounded-lg shadow p-8">
        <SponsorForm action={handleAddSponsor} submitLabel="Sponsor toevoegen" />
      </div>
    </>
  );
}
