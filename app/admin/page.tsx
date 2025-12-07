'use server';
import { requireRole } from '@/lib/utils/auth';
import Link from 'next/link';
import { PruneImagesButton } from '@/components/PruneImagesButton';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { Session } from 'next-auth';

export default async function AdminOverview() {
  await requireRole(['admin', 'contributor']);

  const session = (await getServerSession(authOptions)) as Session | null;
  const isAdmin = session?.user?.role === 'admin';
  return (
    <div className="max-w-2xl mx-auto py-12 px-6 bg-surface rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold mb-8 text-primary">Dashboard Beheer</h1>
      <ul className="space-y-6">
        <li>
          <Link
            href="/admin/shows"
            className="block px-6 py-4 bg-primary text-surface rounded-lg shadow hover:bg-primary/90 font-semibold transition-colors"
          >
            Overzicht Voorstellingen
          </Link>
          <p className="mt-2 text-textSecondary">Bekijk en beheer alle voorstellingen.</p>
        </li>
        <li>
          <Link
            href="/admin/tags"
            className="block px-6 py-4 bg-primary text-surface rounded-lg shadow hover:bg-primary/90 font-semibold transition-colors"
          >
            Tags Beheer
          </Link>
          <p className="mt-2 text-textSecondary">Beheer categorieën en tags voor voorstellingen.</p>
        </li>
        <li>
          <Link
            href="/admin/sales"
            className="block px-6 py-4 bg-primary text-surface rounded-lg shadow hover:bg-primary/90 font-semibold transition-colors"
          >
            Verkopen & Bestellingen
          </Link>
          <p className="mt-2 text-textSecondary">Bekijk verkoopcijfers en alle bestellingen.</p>
        </li>
        <li>
          <Link
            href="/admin/mailing-list"
            className="block px-6 py-4 bg-primary text-surface rounded-lg shadow hover:bg-primary/90 font-semibold transition-colors"
          >
            Nieuwsbrief Versturen
          </Link>
          <p className="mt-2 text-textSecondary">
            Verstuur e-mails naar alle nieuwsbrief abonnees.
          </p>
        </li>
        <li>
          <Link
            href="/admin/pages"
            className="block px-6 py-4 bg-primary text-surface rounded-lg shadow hover:bg-primary/90 font-semibold transition-colors"
          >
            Pagina&apos;s Beheer
          </Link>
          <p className="mt-2 text-textSecondary">Bekijk en beheer statische pagina's.</p>
        </li>
        <li>
          <Link
            href="/admin/sponsors"
            className="block px-6 py-4 bg-primary text-surface rounded-lg shadow hover:bg-primary/90 font-semibold transition-colors"
          >
            Sponsors Beheer
          </Link>
          <p className="mt-2 text-textSecondary">Beheer sponsors en partners van het theater.</p>
        </li>
        {isAdmin && (
          <>
            <li>
              <Link
                href="/admin/coupons"
                className="block px-6 py-4 bg-primary text-surface rounded-lg shadow hover:bg-primary/90 font-semibold transition-colors"
              >
                Coupons Beheer
              </Link>
              <p className="mt-2 text-textSecondary">Beheer kortingscoupons en promoties.</p>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="block px-6 py-4 bg-primary text-surface rounded-lg shadow hover:bg-primary/90 font-semibold transition-colors"
              >
                Gebruikers Beheer
              </Link>
              <p className="mt-2 text-textSecondary">Beheer gebruikers en hun rollen.</p>
            </li>
          </>
        )}
        <li>
          <PruneImagesButton />
        </li>
      </ul>
    </div>
  );
}
