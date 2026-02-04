import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export type BreadcrumbItemData = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItemData[];
};

export function AdminBreadcrumbs({ items }: BreadcrumbsProps) {
  // Always start with Dashboard
  const allItems: BreadcrumbItemData[] = [{ label: 'Dashboard', href: '/admin' }, ...items];

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <BreadcrumbItem key={index}>
              {index > 0 && <BreadcrumbSeparator />}
              {isLast || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
