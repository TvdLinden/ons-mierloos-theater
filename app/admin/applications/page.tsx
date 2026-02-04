'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClientSecret {
  id: string;
  clientApplicationId: string;
  secretHash: string;
  active: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
}

interface ApplicationDefinedScope {
  id: string;
  applicationId: string;
  scope: string;
  description: string | null;
  createdAt: Date;
}

interface GrantedPermission {
  id: string;
  grantedToApplicationId: string;
  definedScopeId: string;
  createdAt: Date;
}

interface ClientApplication {
  id: string;
  name: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
  secrets: ClientSecret[];
  definedScopes: ApplicationDefinedScope[];
  grantedPermissions: GrantedPermission[];
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ClientApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ClientApplication | null>(null);
  const [showNewAppForm, setShowNewAppForm] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newScopeName, setNewScopeName] = useState('');
  const [newScopeDescription, setNewScopeDescription] = useState('');

  // State for granting permission
  const [grantScopeId, setGrantScopeId] = useState<string>('');
  const [granting, setGranting] = useState(false);

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete_app' | 'deactivate_secret' | 'remove_defined_scope' | 'revoke_permission' | null;
    title: string;
    description: string;
    resourceId?: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    description: '',
  });

  // Compute all defined scopes from other apps, excluding already granted and own scopes
  const availableScopesToGrant = selectedApp
    ? applications
        .flatMap((app) =>
          app.definedScopes.map((scope) => ({
            ...scope,
            appName: app.name,
          })),
        )
        .filter(
          (scope) =>
            scope.applicationId !== selectedApp.id &&
            !selectedApp.grantedPermissions.some((perm) => perm.definedScopeId === scope.id),
        )
    : [];

  const findScopeById = (id: string) =>
    applications.flatMap((app) => app.definedScopes).find((s) => s.id === id);

  const formatPermissionLabel = (permission: { definedScopeId: string }) => {
    const s = findScopeById(permission.definedScopeId);
    return s?.scope ?? `Permissie-ID: ${permission.definedScopeId.slice(0, 8)}...`;
  };

  // Fetch all applications
  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/applications');
      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data.applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async () => {
    if (!newAppName.trim()) {
      alert('Application name is required');
      return;
    }

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAppName }),
      });

      if (!res.ok) throw new Error('Failed to create application');

      const newApp = await res.json();
      alert(`Application created! Save this secret: ${newApp.secret}`);
      setNewAppName('');
      setShowNewAppForm(false);
      setSelectedApp(newApp);
      await fetchApplications();
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Failed to create application');
    }
  };

  const handleDeleteApplication = async () => {
    if (!selectedApp) return;

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: selectedApp.id }),
      });

      if (!res.ok) throw new Error('Failed to delete application');

      setSelectedApp(null);
      setConfirmDialog({ isOpen: false, type: null, title: '', description: '' });
      await fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
    }
  };

  const handleGenerateSecret = async (appId: string) => {
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, action: 'generate_secret' }),
      });

      if (!res.ok) throw new Error('Failed to generate secret');

      const newSecret = await res.json();
      alert(`New secret generated! Save this: ${newSecret.secret}`);
      await fetchApplications();
    } catch (error) {
      console.error('Error generating secret:', error);
      alert('Failed to generate secret');
    }
  };

  const handleDeactivateSecret = async (secretId: string) => {
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp?.id,
          action: 'deactivate_secret',
          secretId,
        }),
      });

      if (!res.ok) throw new Error('Failed to deactivate secret');

      setConfirmDialog({ isOpen: false, type: null, title: '', description: '' });
      await fetchApplications();
    } catch (error) {
      console.error('Error deactivating secret:', error);
      alert('Failed to deactivate secret');
    }
  };

  const handleAddDefinedScope = async () => {
    if (!selectedApp || !newScopeName.trim()) {
      alert('Scope name is required');
      return;
    }

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          action: 'add_defined_scope',
          scope: newScopeName,
          description: newScopeDescription || null,
        }),
      });

      if (!res.ok) throw new Error('Failed to add scope');

      setNewScopeName('');
      setNewScopeDescription('');
      await fetchApplications();
      if (selectedApp) {
        const updated = applications.find((a) => a.id === selectedApp.id);
        if (updated) setSelectedApp(updated);
      }
    } catch (error) {
      console.error('Error adding scope:', error);
      alert('Failed to add scope');
    }
  };

  const handleRemoveDefinedScope = async (scopeId: string) => {
    if (!selectedApp) return;

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          action: 'remove_defined_scope',
          scopeId,
        }),
      });

      if (!res.ok) throw new Error('Failed to remove scope');

      setConfirmDialog({ isOpen: false, type: null, title: '', description: '' });
      await fetchApplications();
      if (selectedApp) {
        const updated = applications.find((a) => a.id === selectedApp.id);
        if (updated) setSelectedApp(updated);
      }
    } catch (error) {
      console.error('Error removing scope:', error);
      alert('Failed to remove scope');
    }
  };

  // Open revoke confirmation
  const openRevokePermissionDialog = (permissionId: string, scopeName?: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'revoke_permission',
      title: 'Permissie intrekken',
      description: `Weet je zeker dat je de permissie ${
        scopeName || permissionId.slice(0, 8)
      } wilt intrekken? Hierdoor verliest de app toegang.`,
      resourceId: permissionId,
    });
  };

  // Revoke permission handler
  const revokePermission = async (permissionId?: string) => {
    if (!selectedApp || !permissionId) return;
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          action: 'revoke_permission',
          permissionId,
        }),
      });

      if (!res.ok) throw new Error('Failed to revoke permission');

      setConfirmDialog({ isOpen: false, type: null, title: '', description: '' });
      await fetchApplications();
      // update selectedApp after fetch
      const updated = applications.find((a) => a.id === selectedApp.id);
      if (updated) setSelectedApp(updated);
    } catch (error) {
      console.error('Error revoking permission:', error);
      alert('Failed to revoke permission');
    }
  };

  const handleGrantPermission = async () => {
    if (!selectedApp || !grantScopeId) {
      alert('Select a scope to grant');
      return;
    }
    setGranting(true);
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          action: 'grant_permission',
          definedScopeId: grantScopeId,
        }),
      });
      if (!res.ok) throw new Error('Failed to grant permission');
      setGrantScopeId('');
      await fetchApplications();
      // Update selectedApp after fetch
      if (selectedApp) {
        const updated = applications.find((a) => a.id === selectedApp.id);
        if (updated) setSelectedApp(updated);
      }
    } catch (error) {
      console.error('Error granting permission:', error);
      alert('Failed to grant permission');
    } finally {
      setGranting(false);
    }
  };

  const openDeleteAppDialog = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete_app',
      title: 'Applicatie verwijderen',
      description: `Weet je zeker dat je "${selectedApp?.name}" wilt verwijderen? Alle bijbehorende geheimen en scopes worden ook verwijderd. Deze actie kan niet ongedaan worden gemaakt.`,
    });
  };

  const openDeactivateSecretDialog = (secretId: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'deactivate_secret',
      title: 'Deactiveer geheim',
      description:
        'Weet je zeker dat je dit geheim wilt deactiveren? Het is daarna niet meer bruikbaar voor authenticatie.',
      resourceId: secretId,
    });
  };

  const openRemoveDefinedScopeDialog = (scopeId: string, scopeName: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'remove_defined_scope',
      title: 'Verwijder scope',
      description: `Weet je zeker dat je de scope "${scopeName}" wilt verwijderen? Hierdoor verliezen apps die deze scope hadden toegang.`,
      resourceId: scopeId,
    });
  };

  const handleConfirmAction = () => {
    switch (confirmDialog.type) {
      case 'delete_app':
        handleDeleteApplication();
        break;
      case 'deactivate_secret':
        if (confirmDialog.resourceId) handleDeactivateSecret(confirmDialog.resourceId);
        break;
      case 'remove_defined_scope':
        if (confirmDialog.resourceId) handleRemoveDefinedScope(confirmDialog.resourceId);
        break;
      case 'revoke_permission':
        if (confirmDialog.resourceId) revokePermission(confirmDialog.resourceId);
        break;
    }
  };

  if (loading) return <div className="p-4">Applicaties laden...</div>;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Applications List */}
      <div className="lg:col-span-1">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Clientapplicaties</h2>
          <Button
            onClick={() => setShowNewAppForm(!showNewAppForm)}
            className="mb-4 w-full"
            variant="outline"
          >
            {showNewAppForm ? 'Annuleren' : 'Nieuwe applicatie'}
          </Button>

          {showNewAppForm && (
            <div className="mb-4 space-y-3">
              <Input
                placeholder="Applicatienaam"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
              />
              <Button onClick={handleCreateApplication} className="w-full">
                Aanmaken
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {applications.map((app) => (
              <button
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`w-full rounded p-3 text-left transition ${
                  selectedApp?.id === app.id ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
                }`}
              >
                <div className="text-sm font-medium">{app.name}</div>
                <div className="text-xs text-gray-500">{app.clientId}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Application Details */}
      {selectedApp && (
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Applicatiegegevens</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Naam</label>
                  <Input value={selectedApp.name} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Client-ID</label>
                  <Input value={selectedApp.clientId} disabled />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Aangemaakt</label>
                    <Input value={new Date(selectedApp.createdAt).toLocaleString()} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bijgewerkt</label>
                    <Input value={new Date(selectedApp.updatedAt).toLocaleString()} disabled />
                  </div>
                </div>
              </div>
              <Button onClick={openDeleteAppDialog} variant="destructive" className="mt-4 w-full">
                Verwijder applicatie
              </Button>
            </div>

            {/* Secrets */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Geheimen</h3>
              <div className="mb-4 space-y-2">
                {selectedApp.secrets.map((secret) => (
                  <div
                    key={secret.id}
                    className="flex items-center justify-between rounded bg-gray-50 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {secret.active ? '✓ Actief' : '✗ Inactief'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Aangemaakt: {new Date(secret.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {secret.active && (
                      <Button
                        onClick={() => openDeactivateSecretDialog(secret.id)}
                        variant="outline"
                        size="sm"
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={() => handleGenerateSecret(selectedApp.id)} className="w-full">
                Genereer nieuw geheim
              </Button>
            </div>

            {/* Defined Scopes */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Door deze app gedefinieerde scopes</h3>
              <div className="mb-4 space-y-2">
                {selectedApp.definedScopes.map((scope) => (
                  <div
                    key={scope.id}
                    className="flex items-center justify-between rounded bg-blue-50 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{scope.scope}</div>
                      {scope.description && (
                        <div className="text-xs text-gray-500">{scope.description}</div>
                      )}
                    </div>
                    <Button
                      onClick={() => openRemoveDefinedScopeDialog(scope.id, scope.scope)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Input
                  placeholder="Scope-naam (bv. sync:orders)"
                  value={newScopeName}
                  onChange={(e) => setNewScopeName(e.target.value)}
                />
                <Input
                  placeholder="Beschrijving (optioneel)"
                  value={newScopeDescription}
                  onChange={(e) => setNewScopeDescription(e.target.value)}
                />
                <Button onClick={() => handleAddDefinedScope()} className="w-full">
                  Definieer nieuwe scope
                </Button>
              </div>
            </div>

            {/* Granted Permissions */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Aan deze app verleende permissies</h3>
              <div className="mb-4 space-y-2">
                {selectedApp.grantedPermissions.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">Nog geen permissies verleend</div>
                ) : (
                  selectedApp.grantedPermissions.map((permission) => {
                    const scope = findScopeById(permission.definedScopeId);
                    const permissionLabel = formatPermissionLabel(permission);

                    return (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between rounded bg-green-50 p-3"
                      >
                        <div className="text-sm">
                          <span className="font-medium">{permissionLabel}</span>
                          {scope && scope.description && (
                            <span className="ml-2 text-xs text-gray-500">{scope.description}</span>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRevokePermissionDialog(permission.id, scope?.scope)}
                        >
                          Intrekken
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
              {/* Grant new permission UI */}
              <div className="flex gap-2 items-center mt-4">
                <select
                  className="border rounded px-2 py-1 flex-1"
                  value={grantScopeId}
                  onChange={(e) => setGrantScopeId(e.target.value)}
                  disabled={granting || availableScopesToGrant.length === 0}
                >
                  <option value="">Selecteer scope om te verlenen...</option>
                  {availableScopesToGrant.map((scope) => (
                    <option key={scope.id} value={scope.id}>
                      {scope.scope} (van {scope.appName})
                      {scope.description ? ` — ${scope.description}` : ''}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleGrantPermission}
                  disabled={granting || !grantScopeId}
                  className="whitespace-nowrap"
                >
                  {granting ? 'Bezig...' : 'Verleen permissie'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setConfirmDialog({ isOpen: false, type: null, title: '', description: '' });
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="bg-red-600 hover:bg-red-700"
            >
              {confirmDialog.type === 'delete_app' && 'Verwijder applicatie'}
              {confirmDialog.type === 'deactivate_secret' && 'Deactiveer geheim'}
              {confirmDialog.type === 'remove_defined_scope' && 'Verwijder scope'}
              {confirmDialog.type === 'revoke_permission' && 'Trek permissie in'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
