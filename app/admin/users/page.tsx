import { requireRole } from '@/lib/utils/auth';
import { getAllUsers } from '@/lib/queries/users';
import RoleSelector from '@/components/RoleSelector';
import { User } from '@/lib/db';
import UserSearch from '@/components/UserSearch';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DataTable, EmptyRow } from '@/components/admin/DataTable';
import { UserActionsMenu } from '@/components/admin/UserActionsMenu';

export default async function UsersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await requireRole('admin');

  const { search } = await searchParams;
  const users = await getAllUsers(search);

  return (
    <>
      <AdminPageHeader
        title="Gebruikers Beheer"
        breadcrumbs={[{ label: 'Gebruikers' }]}
      />

      <div className="mb-6">
        <UserSearch />
      </div>

      <DataTable headers={['Naam', 'Email', 'Rol', 'Laatste Login', 'Aangemaakt', 'Acties']}>
        {users.length === 0 ? (
          <EmptyRow colSpan={6} message="Geen gebruikers gevonden" />
        ) : (
          users.map((user: User) => (
            <tr key={user.id} className="hover:bg-zinc-50">
              <td className="px-6 py-4">
                <div className="font-medium text-primary">{user.name || 'N/A'}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-600">{user.email}</div>
              </td>
              <td className="px-6 py-4">
                <RoleSelector userId={user.id} currentRole={user.role || 'user'} />
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-600">
                  {user.lastSignin
                    ? new Date(user.lastSignin).toLocaleDateString('nl-NL')
                    : 'Nooit'}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-zinc-600">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString('nl-NL') : 'N/A'}
                </div>
              </td>
              <td className="px-6 py-4">
                <UserActionsMenu user={user} />
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </>
  );
}
