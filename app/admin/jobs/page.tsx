import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { desc, eq, and, gte } from 'drizzle-orm';
import { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Achtergrondtaken - Admin',
  description: 'Controleer achtergrondtaken',
};

export default async function JobsDashboard({
  searchParams,
}: {
  searchParams: { status?: string; type?: string };
}) {
  const statusFilter = searchParams.status;
  const typeFilter = searchParams.type;

  // Build query with filters
  const conditions = [];
  if (statusFilter) conditions.push(eq(jobs.status, statusFilter as any));
  if (typeFilter) conditions.push(eq(jobs.type, typeFilter as any));

  const allJobs = await db.query.jobs.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(jobs.createdAt)],
    limit: 100,
  });

  // Get stats
  const last24h = new Date();
  last24h.setHours(last24h.getHours() - 24);

  const recentJobs = await db.query.jobs.findMany({
    where: gte(jobs.createdAt, last24h),
  });

  const stats = {
    total: allJobs.length,
    pending: allJobs.filter((j) => j.status === 'pending').length,
    processing: allJobs.filter((j) => j.status === 'processing').length,
    completed: allJobs.filter((j) => j.status === 'completed').length,
    failed: allJobs.filter((j) => j.status === 'failed').length,
    last24h: recentJobs.length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-text-primary font-display">Achtergrondtaken</h1>
        <Link
          href="/admin"
          className="text-sm text-primary hover:underline"
        >
          ← Terug naar admin
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Totaal" value={stats.total} color="blue" />
        <StatCard label="In wachtrij" value={stats.pending} color="yellow" />
        <StatCard label="Verwerken" value={stats.processing} color="purple" />
        <StatCard label="Voltooid" value={stats.completed} color="green" />
        <StatCard label="Mislukt" value={stats.failed} color="red" />
        <StatCard label="Laatste 24u" value={stats.last24h} color="gray" />
      </div>

      {/* Filters */}
      <div className="bg-surface rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <FilterButton href="/admin/jobs" label="Alles" active={!statusFilter && !typeFilter} />
          <FilterButton
            href="/admin/jobs?status=pending"
            label="In wachtrij"
            active={statusFilter === 'pending'}
          />
          <FilterButton
            href="/admin/jobs?status=processing"
            label="Verwerken"
            active={statusFilter === 'processing'}
          />
          <FilterButton
            href="/admin/jobs?status=failed"
            label="Mislukt"
            active={statusFilter === 'failed'}
          />
          <div className="border-l border-border mx-2"></div>
          <FilterButton
            href="/admin/jobs?type=payment_creation"
            label="Betaling Aanmaken"
            active={typeFilter === 'payment_creation'}
          />
          <FilterButton
            href="/admin/jobs?type=payment_webhook"
            label="Webhooks"
            active={typeFilter === 'payment_webhook'}
          />
          <FilterButton
            href="/admin/jobs?type=orphaned_order_cleanup"
            label="Opschoning"
            active={typeFilter === 'orphaned_order_cleanup'}
          />
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-surface rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pogingen
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gemaakt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volgende Poging
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fout
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">
                    {job.id.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{job.type}</code>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{job.executionCount}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {new Date(job.createdAt || '').toLocaleString('nl-NL', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-secondary">
                    {job.nextRetryAt
                      ? new Date(job.nextRetryAt).toLocaleString('nl-NL', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate" title={job.errorMessage || ''}>
                    {job.errorMessage || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allJobs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium mb-2">Geen taken gevonden</p>
            <p className="text-sm">Probeer je filters aan te passen of kom later terug</p>
          </div>
        )}

        {allJobs.length === 100 && (
          <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-3 text-center text-sm text-yellow-800">
            De eerste 100 resultaten worden weergegeven. Gebruik filters om de lijst te beperken.
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <h3 className="font-semibold mb-2">💡 Informatie over Achtergrondtaken</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li>Taken worden elke 5 seconden verwerkt door de worker</li>
          <li>Mislukte taken worden opnieuw geprobeerd met exponentiële vertraging (5s → 10s → 20s → 40s → 80s)</li>
          <li>Maximaal 5 pogingen voordat een taak permanent als mislukt wordt gemarkeerd</li>
          <li>Webhook-taken reageren in &lt;100ms om herhaalde pogingen van de provider te voorkomen</li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800',
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color as keyof typeof colors]}`}>
      <p className="text-xs uppercase tracking-wide opacity-75 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    pending: 'In wachtrij',
    processing: 'Verwerken',
    completed: 'Voltooid',
    failed: 'Mislukt',
  };
  return labels[status] || status;
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

function FilterButton({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </Link>
  );
}
