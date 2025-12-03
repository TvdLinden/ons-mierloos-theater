import Link from 'next/link';
import { ReactNode } from 'react';

type AdminPageHeaderProps = {
  title: string;
  backHref?: string;
  action?:
    | {
        href: string;
        label: string;
      }
    | ReactNode;
};

export function AdminPageHeader({ title, backHref = '/admin', action }: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      <Link
        href={backHref}
        className="text-primary hover:text-secondary font-medium mb-4 inline-block"
      >
        ← Terug naar dashboard
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-primary">{title}</h1>
        {action && (
          <>
            {typeof action === 'object' && 'href' in action ? (
              <Link
                href={action.href}
                className="px-4 py-2 bg-accent text-surface rounded font-semibold hover:bg-secondary shadow transition-colors"
              >
                {action.label}
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
