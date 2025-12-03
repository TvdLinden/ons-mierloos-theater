import Link from 'next/link';
import { getAllSponsors } from '@/lib/queries/sponsors';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { EmptyRow } from '@/components/admin/DataTable';
import { getImageUrl } from '@/lib/utils/image';

export default async function SponsorsAdminPage() {
  const sponsors = await getAllSponsors();

  const tierLabels = {
    gold: 'Goud',
    silver: 'Zilver',
    bronze: 'Brons',
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <AdminPageHeader
        title="Sponsors Beheer"
        backHref="/admin"
        action={
          <Link
            href="/admin/sponsors/add"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            + Sponsor toevoegen
          </Link>
        }
      />

      <DataTable headers={['Logo', 'Naam', 'Tier', 'Website', 'Volgorde', 'Status', 'Acties']}>
        {sponsors.length === 0 ? (
          <EmptyRow colSpan={7} message="Geen sponsors gevonden" />
        ) : (
          sponsors.map((sponsor) => (
            <tr key={sponsor.id} className="border-b border-border hover:bg-muted/50">
              <td className="px-6 py-4">
                {sponsor.logoId && sponsor.logo ? (
                  <img
                    src={getImageUrl(sponsor.logoId)}
                    alt={sponsor.name}
                    className="h-12 w-24 object-contain"
                  />
                ) : (
                  <span className="text-text-secondary text-sm">Geen logo</span>
                )}
              </td>
              <td className="px-6 py-4 font-medium text-text-primary">{sponsor.name}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    sponsor.tier === 'gold'
                      ? 'bg-secondary/20 text-secondary'
                      : sponsor.tier === 'silver'
                        ? 'bg-text-secondary/20 text-text-secondary'
                        : 'bg-warning/20 text-warning'
                  }`}
                >
                  {tierLabels[sponsor.tier]}
                </span>
              </td>
              <td className="px-6 py-4 text-text-secondary">
                {sponsor.website ? (
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Website
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-6 py-4 text-center text-text-secondary">{sponsor.displayOrder}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    sponsor.active === 1 ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                  }`}
                >
                  {sponsor.active === 1 ? 'Actief' : 'Inactief'}
                </span>
              </td>
              <td className="px-6 py-4">
                <Link
                  href={`/admin/sponsors/edit/${sponsor.id}`}
                  className="text-primary hover:underline"
                >
                  Bewerk
                </Link>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </div>
  );
}
