import Link from 'next/link';
import { ReactNode } from 'react';
import { Button } from '../ui';
import { AdminBreadcrumbs, BreadcrumbItemData } from './Breadcrumbs';

type AdminPageHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItemData[];
  action?:
    | {
        href: string;
        label: string;
      }
    | ReactNode;
};

export function AdminPageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      <AdminBreadcrumbs items={breadcrumbs} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {action && (
          <>
            {typeof action === 'object' && 'href' in action ? (
              <Link href={action.href}>
                <Button variant="secondary">{action.label}</Button>
              </Link>
            ) : (
              action
            )}
          </>
        )}
      </div>
    </div>
  );
}
