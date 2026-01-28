'use server';
import { requireRole } from '@/lib/utils/auth';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/utils/auth';
import { Session } from 'next-auth';
import {
  Zap,
  Tag,
  ShoppingCart,
  Mail,
  FileText,
  Users,
  Ticket,
  UserCog,
  Image,
  Layout,
  Settings,
  Lock,
  Clock,
} from 'lucide-react';

interface AdminFeature {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  href: string;
  adminOnly?: boolean;
}

const features: AdminFeature[] = [
  {
    icon: Zap,
    label: 'Overzicht Voorstellingen',
    description: 'Bekijk en beheer alle voorstellingen.',
    href: '/admin/shows',
  },
  {
    icon: Tag,
    label: 'Tags Beheer',
    description: 'Beheer categorieën en tags voor voorstellingen.',
    href: '/admin/tags',
  },
  {
    icon: Image,
    label: 'Afbeeldingen Beheer',
    description: 'Beheer alle afbeeldingen in het systeem.',
    href: '/admin/images',
  },
  {
    icon: ShoppingCart,
    label: 'Verkopen & Bestellingen',
    description: 'Bekijk verkoopcijfers en alle bestellingen.',
    href: '/admin/sales',
  },
  {
    icon: Mail,
    label: 'Nieuwsbrief Versturen',
    description: 'Verstuur e-mails naar alle nieuwsbrief abonnees.',
    href: '/admin/mailing-list',
  },
  {
    icon: Layout,
    label: 'Content Beheer',
    description: 'Beheer header, footer en homepage inhoud.',
    href: '/admin/content',
  },
  {
    icon: Users,
    label: 'Sponsors Beheer',
    description: 'Beheer sponsors en partners van het theater.',
    href: '/admin/sponsors',
  },
  {
    icon: Ticket,
    label: 'Coupons Beheer',
    description: 'Beheer kortingscoupons en promoties.',
    href: '/admin/coupons',
    adminOnly: true,
  },
  {
    icon: UserCog,
    label: 'Gebruikers Beheer',
    description: 'Beheer gebruikers en hun rollen.',
    href: '/admin/users',
    adminOnly: true,
  },
  {
    icon: Settings,
    label: 'Site Instellingen',
    description: 'Beheer SEO instellingen voor betere vindbaarheid.',
    href: '/admin/settings',
    adminOnly: true,
  },
  {
    icon: Clock,
    label: 'Achtergrondtaken',
    description: 'Bekijk status en logs van achtergrondtaken.',
    href: '/admin/jobs',
    adminOnly: true,
  },
  {
    icon: Lock,
    label: 'Client Applicaties',
    description: 'Beheer client applicaties, secrets en scopes voor API access.',
    href: '/admin/applications',
    adminOnly: true,
  },
];

export default async function AdminOverview() {
  await requireRole(['admin', 'contributor']);

  const session = (await getServerSession(authOptions)) as Session | null;
  const isAdmin = session?.user?.role === 'admin';

  const visibleFeatures = features.filter((f) => !f.adminOnly || isAdmin);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <h1 className="text-4xl font-bold mb-2 text-foreground">Dashboard Beheer</h1>
      <p className="text-muted-foreground mb-8">Beheer alle aspecten van het theater</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {visibleFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link
              key={feature.label}
              href={feature.href}
              className="group relative rounded-lg border bg-card p-6 hover:shadow-lg hover:border-primary/50 transition-all"
            >
              <Icon className="h-8 w-8 mb-3 text-primary group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-foreground mb-1">{feature.label}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
              <div className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
