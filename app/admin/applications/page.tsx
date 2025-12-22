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
import { Textarea } from '@/components/ui/textarea';

interface ClientSecret {
  id: string;
  clientApplicationId: string;
  secretHash: string;
  active: boolean;
  createdAt: Date;
  lastUsedAt: Date | null;
}

interface ClientScope {
  id: string;
  clientApplicationId: string;
  targetApplicationId: string;
  scope: string;
  createdAt: Date;
}

interface ClientApplication {
  id: string;
  name: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
  secrets: ClientSecret[];
  scopes: ClientScope[];
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ClientApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<ClientApplication | null>(null);
  const [showNewAppForm, setShowNewAppForm] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newScopeName, setNewScopeName] = useState('');
  const [newScopeTargetId, setNewScopeTargetId] = useState('');

  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'delete_app' | 'deactivate_secret' | 'remove_scope' | null;
    title: string;
    description: string;
    resourceId?: string;
  }>({
    isOpen: false,
    type: null,
    title: '',
    description: '',
  });

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
      setApplications(data);
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

  const handleAddScope = async () => {
    if (!selectedApp || !newScopeName.trim() || !newScopeTargetId.trim()) {
      alert('Scope name and target application ID are required');
      return;
    }

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          action: 'add_scope',
          scope: newScopeName,
          targetApplicationId: newScopeTargetId,
        }),
      });

      if (!res.ok) throw new Error('Failed to add scope');

      setNewScopeName('');
      setNewScopeTargetId('');
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

  const handleRemoveScope = async (scopeId: string) => {
    if (!selectedApp) return;

    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          action: 'remove_scope',
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

  const openDeleteAppDialog = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'delete_app',
      title: 'Delete Application',
      description: `Are you sure you want to delete "${selectedApp?.name}"? This will also delete all associated secrets and scopes. This action cannot be undone.`,
    });
  };

  const openDeactivateSecretDialog = (secretId: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'deactivate_secret',
      title: 'Deactivate Secret',
      description:
        'Are you sure you want to deactivate this secret? It will no longer be usable for authentication.',
      resourceId: secretId,
    });
  };

  const openRemoveScopeDialog = (scopeId: string, scopeName: string) => {
    setConfirmDialog({
      isOpen: true,
      type: 'remove_scope',
      title: 'Remove Scope',
      description: `Are you sure you want to remove the "${scopeName}" scope? This will revoke access to this feature for this application.`,
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
      case 'remove_scope':
        if (confirmDialog.resourceId) handleRemoveScope(confirmDialog.resourceId);
        break;
    }
  };

  if (loading) return <div className="p-4">Loading applications...</div>;

  return (
    <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
      {/* Applications List */}
      <div className="lg:col-span-1">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Client Applications</h2>
          <Button
            onClick={() => setShowNewAppForm(!showNewAppForm)}
            className="mb-4 w-full"
            variant="outline"
          >
            {showNewAppForm ? 'Cancel' : 'New Application'}
          </Button>

          {showNewAppForm && (
            <div className="mb-4 space-y-3">
              <Input
                placeholder="Application name"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
              />
              <Button onClick={handleCreateApplication} className="w-full">
                Create
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
              <h3 className="mb-4 text-lg font-semibold">Application Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input value={selectedApp.name} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium">Client ID</label>
                  <Input value={selectedApp.clientId} disabled />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <Input value={new Date(selectedApp.createdAt).toLocaleString()} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Updated</label>
                    <Input value={new Date(selectedApp.updatedAt).toLocaleString()} disabled />
                  </div>
                </div>
              </div>
              <Button onClick={openDeleteAppDialog} variant="destructive" className="mt-4 w-full">
                Delete Application
              </Button>
            </div>

            {/* Secrets */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Secrets</h3>
              <div className="mb-4 space-y-2">
                {selectedApp.secrets.map((secret) => (
                  <div
                    key={secret.id}
                    className="flex items-center justify-between rounded bg-gray-50 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {secret.active ? '✓ Active' : '✗ Inactive'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(secret.createdAt).toLocaleDateString()}
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
                Generate New Secret
              </Button>
            </div>

            {/* Scopes */}
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">Scopes & Permissions</h3>
              <div className="mb-4 space-y-2">
                {selectedApp.scopes.map((scope) => (
                  <div
                    key={scope.id}
                    className="flex items-center justify-between rounded bg-gray-50 p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{scope.scope}</div>
                      <div className="text-xs text-gray-500">
                        Target: {scope.targetApplicationId}
                      </div>
                    </div>
                    <Button
                      onClick={() => openRemoveScopeDialog(scope.id, scope.scope)}
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
                  placeholder="Scope name (e.g., sync:orders)"
                  value={newScopeName}
                  onChange={(e) => setNewScopeName(e.target.value)}
                />
                <Input
                  placeholder="Target Application ID"
                  value={newScopeTargetId}
                  onChange={(e) => setNewScopeTargetId(e.target.value)}
                />
                <Button onClick={handleAddScope} className="w-full">
                  Add Scope
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="bg-red-600 hover:bg-red-700"
            >
              {confirmDialog.type === 'delete_app' && 'Delete Application'}
              {confirmDialog.type === 'deactivate_secret' && 'Deactivate Secret'}
              {confirmDialog.type === 'remove_scope' && 'Remove Scope'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
