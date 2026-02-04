import { redirect, notFound } from 'next/navigation';
import { getSponsorById } from '@/lib/queries/sponsors';
import { updateSponsor, deleteSponsor } from '@/lib/commands/sponsors';
import SponsorForm from '@/components/SponsorForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { handleImageUpload } from '@/lib/utils/imageUpload';

async function handleUpdateSponsor(
  id: string,
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

    await updateSponsor(id, {
      name,
      logoId: logoId || null,
      website: website || null,
      tier,
      displayOrder,
      active,
    });
  } catch (error) {
    console.error('Error updating sponsor:', error);
    return { error: 'Er is een fout opgetreden bij het bijwerken van de sponsor' };
  }

  redirect('/admin/sponsors');
}

async function handleDeleteSponsor(id: string) {
  'use server';
  await deleteSponsor(id);
  redirect('/admin/sponsors');
}

export default async function EditSponsorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sponsor = await getSponsorById(id);

  if (!sponsor) {
    notFound();
  }

  const boundUpdateAction = handleUpdateSponsor.bind(null, id);
  const boundDeleteAction = handleDeleteSponsor.bind(null, id);

  return (
    <>
      <AdminPageHeader
        title="Sponsor bewerken"
        breadcrumbs={[
          { label: 'Sponsors', href: '/admin/sponsors' },
          { label: sponsor.name },
        ]}
      />
      <div className="bg-surface rounded-lg shadow p-8">
        <SponsorForm
          initialData={{
            name: sponsor.name,
            logoId: sponsor.logoId,
            website: sponsor.website || '',
            tier: sponsor.tier,
            displayOrder: sponsor.displayOrder || 0,
            active: sponsor.active,
          }}
          action={boundUpdateAction}
          submitLabel="Sponsor bijwerken"
        />

        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold text-error mb-4">Gevaarzone</h3>
          <p className="text-text-secondary mb-4">
            Het verwijderen van een sponsor kan niet ongedaan worden gemaakt.
          </p>
          <form action={boundDeleteAction}>
            <button
              type="submit"
              className="bg-error text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Sponsor verwijderen
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
