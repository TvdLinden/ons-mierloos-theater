'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import type { SocialMediaLink } from '@/lib/db';
import {
  createSocialMediaLinkAction,
  updateSocialMediaLinkAction,
  deleteSocialMediaLinkAction,
  toggleSocialMediaLinkActiveAction,
} from './actions';

interface SocialMediaLinksListProps {
  links: SocialMediaLink[];
}

const PLATFORM_OPTIONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
];

export function SocialMediaLinksList({ links }: SocialMediaLinksListProps) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<SocialMediaLink | null>(null);
  const [editingLink, setEditingLink] = useState<SocialMediaLink | null>(null);

  const [formData, setFormData] = useState({
    platform: '',
    url: '',
  });

  const [editForm, setEditForm] = useState({
    platform: '',
    url: '',
    active: 1,
  });

  const handleSubmit = () => {
    startTransition(async () => {
      const nextOrder = Math.max(...links.map((l) => l.displayOrder), 0) + 1;
      const result = await createSocialMediaLinkAction({
        platform: formData.platform,
        url: formData.url,
        displayOrder: nextOrder,
        active: 1,
      });

      if (result.success) {
        setFormData({ platform: '', url: '' });
        setShowAddForm(false);
      }
    });
  };

  const handleEdit = (link: SocialMediaLink) => {
    setEditingLink(link);
    setEditForm({
      platform: link.platform,
      url: link.url,
      active: link.active,
    });
    setEditDialogOpen(true);
  };

  const confirmEdit = () => {
    if (!editingLink) return;

    startTransition(async () => {
      const result = await updateSocialMediaLinkAction(editingLink.id, {
        platform: editForm.platform,
        url: editForm.url,
        active: editForm.active,
      });

      if (result.success) {
        setEditDialogOpen(false);
        setEditingLink(null);
      }
    });
  };

  const handleMove = (link: SocialMediaLink, direction: 'up' | 'down') => {
    const currentIndex = links.findIndex((l) => l.id === link.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= links.length) return;

    const targetLink = links[targetIndex];

    startTransition(async () => {
      await Promise.all([
        updateSocialMediaLinkAction(link.id, {
          displayOrder: targetLink.displayOrder,
        }),
        updateSocialMediaLinkAction(targetLink.id, {
          displayOrder: link.displayOrder,
        }),
      ]);
    });
  };

  const toggleActive = (link: SocialMediaLink) => {
    startTransition(async () => {
      await toggleSocialMediaLinkActiveAction(link.id, link.active === 1 ? 0 : 1);
    });
  };

  const confirmDelete = () => {
    if (!selectedLink) return;

    startTransition(async () => {
      const result = await deleteSocialMediaLinkAction(selectedLink.id);
      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedLink(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {links.length} social media {links.length === 1 ? 'link' : 'links'}
        </p>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Voeg Link Toe
        </Button>
      </div>

      {showAddForm && (
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-semibold">Nieuwe Social Media Link</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="platform" className="text-sm font-medium">
                Platform
              </label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer platform" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="url" className="text-sm font-medium">
                URL
              </label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={isPending || !formData.platform || !formData.url}>
              Toevoegen
            </Button>
            <Button onClick={() => setShowAddForm(false)} variant="outline">
              Annuleren
            </Button>
          </div>
        </div>
      )}

      {links.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Volgorde</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link, index) => (
              <TableRow key={link.id}>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(link, 'up')}
                      disabled={isPending || index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(link, 'down')}
                      disabled={isPending || index === links.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-medium capitalize">{link.platform}</TableCell>
                <TableCell className="max-w-xs truncate">{link.url}</TableCell>
                <TableCell>
                  <Badge
                    variant={link.active === 1 ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => toggleActive(link)}
                  >
                    {link.active === 1 ? 'Actief' : 'Inactief'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(link)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLink(link);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Geen social media links gevonden. Klik op "Voeg Link Toe" om te beginnen.
        </p>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de gegevens van deze social media link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-platform" className="text-sm font-medium">
                Platform
              </label>
              <Select
                value={editForm.platform}
                onValueChange={(value) => setEditForm({ ...editForm, platform: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORM_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="edit-url" className="text-sm font-medium">
                URL
              </label>
              <Input
                id="edit-url"
                value={editForm.url}
                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editForm.active === 1}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked ? 1 : 0 })}
                className="rounded"
              />
              <label htmlFor="edit-active" className="text-sm font-medium">
                Actief
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={confirmEdit} disabled={isPending}>
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Link Verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze social media link wilt verwijderen? Deze actie kan niet
              ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
