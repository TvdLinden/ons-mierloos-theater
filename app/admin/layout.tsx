import { requireRole } from '@/lib/utils/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(['admin', 'contributor']);

  return <div className="py-12 px-6">{children}</div>;
}
